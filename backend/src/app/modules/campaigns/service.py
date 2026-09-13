"""Campaign / broadcast management.

A campaign sends a message template to all (or a filtered set of) contacts in
the workspace, one-by-one with a small delay to avoid hammering Meta's API.

Lifecycle:
  draft -> scheduled/ready -> running -> completed/failed

Meta compliance: every send goes through the same messaging service (RESPONSE
within the 24h window). If a contact is not eligible, it is skipped.
"""

from __future__ import annotations

import asyncio
import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Campaign, CampaignRecipient, Contact, Workspace
from app.schemas.campaigns import CampaignCreate


async def list_campaigns(db: AsyncSession, workspace: Workspace) -> list[Campaign]:
    result = await db.execute(
        select(Campaign).where(
            Campaign.workspace_id == workspace.id, Campaign.deleted_at.is_(None)
        ).order_by(Campaign.created_at.desc())
    )
    return list(result.scalars().all())


async def create_campaign(
    db: AsyncSession, workspace: Workspace, data: CampaignCreate, user_id: uuid.UUID
) -> Campaign:
    campaign = Campaign(
        workspace_id=workspace.id,
        name=data.name,
        status="draft",
        message_template=data.message,
        page_id=data.page_id,
        schedule_at=data.schedule_at,
        created_by=user_id,
        enabled=False,
    )
    db.add(campaign)
    await db.flush()

    # Populate recipients from all (or filtered) contacts.
    contacts = await _list_target_contacts(db, workspace, data.audience_filter)
    campaign.total_count = len(contacts)
    for contact in contacts:
        db.add(CampaignRecipient(campaign_id=campaign.id, contact_id=contact.id, status="pending"))
    await db.commit()
    await db.refresh(campaign)
    return campaign


async def _list_target_contacts(
    db: AsyncSession, workspace: Workspace, audience_filter: dict | None
) -> list[Contact]:
    stmt = select(Contact).where(
        Contact.workspace_id == workspace.id, Contact.deleted_at.is_(None)
    )
    if audience_filter and audience_filter.get("lead_status"):
        stmt = stmt.where(Contact.lead_status == audience_filter["lead_status"])
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def enable_campaign(
    db: AsyncSession, workspace: Workspace, campaign_id: uuid.UUID, enabled: bool
) -> Campaign | None:
    campaign = await db.get(Campaign, campaign_id)
    if campaign is None or campaign.workspace_id != workspace.id:
        return None
    campaign.enabled = enabled
    if enabled and campaign.status in ("draft", "paused", "failed"):
        campaign.status = "queued" if campaign.schedule_at else "running"
    elif not enabled and campaign.status in ("queued", "running"):
        campaign.status = "paused"
    await db.commit()
    await db.refresh(campaign)
    return campaign


async def delete_campaign(db: AsyncSession, workspace: Workspace, campaign_id: uuid.UUID) -> bool:
    campaign = await db.get(Campaign, campaign_id)
    if campaign is None or campaign.workspace_id != workspace.id:
        return False
    campaign.deleted_at = datetime.now(UTC)
    campaign.enabled = False
    await db.commit()
    return True


async def run_pending_send(
    db: AsyncSession, workspace: Workspace, campaign_id: uuid.UUID
) -> dict:
    """Send the campaign to all pending recipients (blocks until done).

    Called by the worker/task. Sends one message at a time with a short delay.
    Returns a summary dict.
    """
    from app.core.errors import MetaApiError
    from app.core.security import decrypt_secret
    from app.models import FacebookPage, PageToken
    from app.services.meta_client import meta_client

    campaign = await db.get(Campaign, campaign_id)
    if campaign is None or campaign.workspace_id != workspace.id:
        return {"error": "campaign not found"}

    if campaign.page_id is None:
        # Use the most recently connected Page for this workspace.
        page_result = await db.execute(
            select(FacebookPage)
            .where(FacebookPage.workspace_id == workspace.id, FacebookPage.disconnected_at.is_(None))
            .order_by(FacebookPage.created_at.desc())
            .limit(1)
        )
        page = page_result.scalar_one_or_none()
    else:
        page = await db.get(FacebookPage, campaign.page_id)

    if page is None:
        campaign.status = "failed"
        await db.commit()
        return {"error": "no connected page"}

    token_result = await db.execute(
        select(PageToken)
        .where(PageToken.facebook_page_id == page.id, PageToken.invalidated_at.is_(None))
        .order_by(PageToken.created_at.desc())
        .limit(1)
    )
    token_row = token_result.scalar_one_or_none()
    if token_row is None:
        campaign.status = "failed"
        await db.commit()
        return {"error": "no valid page token"}
    page_token = decrypt_secret(token_row.token_enc)

    campaign.status = "running"
    await db.commit()

    recipients_result = await db.execute(
        select(CampaignRecipient, Contact)
        .join(Contact, Contact.id == CampaignRecipient.contact_id)
        .where(
            CampaignRecipient.campaign_id == campaign.id,
            CampaignRecipient.status == "pending",
        )
        .order_by(CampaignRecipient.created_at.asc())
    )
    rows = list(recipients_result.all())

    sent = 0
    skipped = 0
    failed = 0
    for recipient, contact in rows:
        try:
            await meta_client.send_message(
                page.page_id, page_token, contact.psid, campaign.message_template
            )
            recipient.status = "sent"
            recipient.sent_at = datetime.now(UTC)
            sent += 1
            await db.commit()
        except MetaApiError as exc:
            recipient.status = "failed"
            recipient.error = exc.message
            failed += 1
            await db.commit()
        except Exception as exc:  # noqa: BLE001
            recipient.status = "failed"
            recipient.error = str(exc)
            failed += 1
            await db.commit()

        # Small random-ish delay to be polite to Meta (configurable floor).
        await asyncio.sleep(2)

    campaign.sent_count = (campaign.sent_count or 0) + sent
    campaign.status = "completed"
    campaign.enabled = False
    await db.commit()
    await db.refresh(campaign)

    return {"sent": sent, "skipped": skipped, "failed": failed}
