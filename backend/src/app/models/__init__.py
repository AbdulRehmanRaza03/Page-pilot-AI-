"""Model registry — importing this module registers all models with Base.metadata.

Import order matters for Alembic autogenerate to resolve foreign keys correctly.
"""

from app.models.auth import (
    Invitation,
    Permission,
    Role,
    Session,
    User,
    Workspace,
    WorkspaceMember,
    role_permissions,
)
from app.models.automation import (
    AiAction,
    AiActionLog,
    AiMessage,
    AiSession,
    AuditLog,
    Automation,
    AutomationExecution,
    AutomationExecutionStep,
    AutomationNode,
)
from app.models.campaigns import Campaign, CampaignAudience, CampaignRecipient
from app.models.facebook import FacebookAccount, FacebookPage, PageToken
from app.models.messaging import (
    Contact,
    ContactLabel,
    Conversation,
    ConversationLabel,
    Label,
    Message,
    MessageEvent,
    Note,
)
from app.models.platform import OAuthState, OutboundJob, WebhookEvent

__all__ = [
    "User",
    "Session",
    "Workspace",
    "WorkspaceMember",
    "Role",
    "Permission",
    "role_permissions",
    "Invitation",
    "FacebookAccount",
    "FacebookPage",
    "PageToken",
    "Contact",
    "Conversation",
    "Message",
    "MessageEvent",
    "Label",
    "ContactLabel",
    "ConversationLabel",
    "Note",
    "Campaign",
    "CampaignAudience",
    "CampaignRecipient",
    "Automation",
    "AutomationNode",
    "AutomationExecution",
    "AutomationExecutionStep",
    "AiSession",
    "AiMessage",
    "AiAction",
    "AiActionLog",
    "AuditLog",
    "WebhookEvent",
    "OutboundJob",
    "OAuthState",
]
