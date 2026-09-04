# 03 — Personas & Use Cases

Reference: product definition in `02-product-requirements.md`, flows in `05-user-flows.md`, UI in `06-ui-ux-specification.md`.

## 1. Target Personas

PagePilot serves teams and solo operators who run real conversations on Facebook. The eight primary personas below share one platform but use it differently. Each persona documents **Goals, Problems, Typical workflow, Required features, Pain points, and Expected outcomes**.

---

### Persona 1 — Small Business Owner ("Rania's Bakery")

**Profile.** Rania owns a single-location bakery. One Facebook Page, ~30 messages/day. No marketing team. She answers messages herself between serving customers.

**Goals**
- Never miss a customer question about hours, orders, or menu.
- Answer faster without hiring someone.
- Turn "do you make birthday cakes?" into an actual order.

**Problems**
- Facebook's Page Inbox app is buried and slow; she misses messages for hours.
- No shared view if her part-time helper also answers.
- No memory of past customers — she re-asks the same info.

**Typical workflow**
1. Morning: open PagePilot, triage overnight messages with suggested replies.
2. During the day: answer via a single inbox, save repeat answers as templates.
3. Evening: glance at the dashboard for message count and missed leads.

**Required features**
- One unified inbox across the single Page (simple view).
- AI-suggested replies and saved templates.
- Minimal onboarding — connect Page, done.
- Basic lead capture (name, phone, request).

**Pain points**
- Non-technical: any multi-step config or jargon drives her away.
- Cost sensitivity: she needs obvious ROI before paying.
- She must never accidentally send off-hours marketing messages (Meta compliance done for her).

**Expected outcomes**
- First response time drops from ~3 hours to under 15 minutes.
- Every product question lands in a pipeline she can follow up on.
- No lost orders from unanswered messages.

---

### Persona 2 — E-commerce Seller ("NovaThreads")

**Profile.** Runs a Shopify-style store with 2–3 Facebook Pages, high message volume, frequent product/order questions. Has a small VA (virtual assistant) helping.

**Goals**
- Manage order status ("where is my order?") and product availability questions at scale.
- Drive repeat purchases through Messenger segments.
- Attribute which conversations turn into sales.

**Problems**
- Volume is too high to answer manually; support questions mix with sales questions.
- No clean handoff between seller and VA.
- Can't reliably re-contact buyers after 24 hours legally.

**Typical workflow**
1. Connect all store Pages.
2. Automate routing: order-status intents auto-answered with template + order lookup note.
3. Tag buyers by product interest; segment for follow-up.
4. Launch targeted campaigns to in-window eligible buyers only.

**Required features**
- Intent detection and automation (trigger on "order"/"shipping").
- Contact tagging, lead scoring, product-interest attribution.
- Campaign engine with strict 24-hour-window eligibility checks.
- Team roles (assign to VA).

**Pain points**
- Fear of Meta penalties for non-compliant sends elsewhere.
- Needs segmentation that actually respects messaging windows and tags.

**Expected outcomes**
- Support load reduced via automation; humans handle only exceptions.
- Higher repeat-purchase rate from compliant re-engagement.
- Clear line from conversation → lead → sale.

---

### Persona 3 — Marketing Agency ("BrightFunnel")

**Profile.** Manages Facebook Pages for 20+ client brands. Dedicated account managers. Runs campaigns and reports to clients.

**Goals**
- Manage many client Pages from one place without juggling Meta Business logins.
- Launch and track campaigns per client.
- Produce client-ready performance reports.

**Problems**
- Scattered access across Meta Business Manager is slow and risky.
- No unified view across clients.
- Reporting is manual (screenshots + spreadsheets).

**Typical workflow**
1. Create one workspace per client (or a multi-brand workspace), connect each client's Pages.
2. Build and launch campaigns with audience segments.
3. Monitor delivery/failure and response metrics.
4. Export analytics for client reports.

**Required features**
- Multi-workspace / multi-Page organization (see Persona 7 for multi-brand).
- Client isolation — never cross-contaminate data.
- Campaign performance analytics export.
- Team roles (account manager vs. admin).

**Pain points**
- Strict tenant isolation is non-negotiable (privacy, contracts).
- Needs Page reauthorization handled cleanly when client tokens expire.

**Expected outcomes**
- One login manages all clients; client data fully isolated.
- Campaign results tracked per Page/brand for reporting.
- Hours saved per week on report assembly.

---

### Persona 4 — Social Media Manager ("Maya")

**Profile.** In-house marketer for a mid-size brand. Owns the content calendar and community engagement. Doesn't do sales.

**Goals**
- Keep the community engaged and on-brand quickly.
- Route sales/lead questions to the right teammate.
- Stay within Meta's messaging rules without thinking about them.

**Problems**
- Mixing community chatter with hot sales leads in one inbox means leads get lost.
- On-brand tone is hard to hold across fast replies.
- Messaging-window rules are confusing; she's afraid of sending something that gets the Page flagged.

**Typical workflow**
1. Scan inbox, filter by unread/missed.
2. Use AI-suggested replies + saved on-brand templates.
3. Assign sales questions to a sales colleague; add notes/labels.
4. Schedule follow-ups inside the window.

**Required features**
- Conversation assign/unassign and statuses.
- Labels and notes.
- Templates and tone-consistent AI drafting.
- Window/tag guidance surfaced in the compose UI.

**Pain points**
- Needs clear in-UI warnings about the 24-hour window (which message types are allowed now).
- Wants to make sure no marketing blast leaves without approval.

**Expected outcomes**
- Leads reliably routed, community replied to quickly.
- Zero accidental policy violations.
- Consistent on-brand voice across replies.

---

### Persona 5 — Sales Team ("DealFlow Reps")

**Profile.** 3–10 sales reps handling inbound Messenger leads. Compensated on qualified-lead-to-close conversion.

**Goals**
- Convert Messenger conversations into tracked, scored leads in a pipeline.
- Prioritize the hottest leads.
- Follow up systematically until closed.

**Problems**
- Leads trapped inside a shared inbox with no ownership or stage.
- No scoring/prioritization — everything looks equal.
- No clean follow-up mechanism after the window closes.

**Typical workflow**
1. New conversation auto-creates a contact; rep qualifies it.
2. Rep moves lead through stages (New → Qualified → Contacted → Won/Lost).
3. Rep tags, assigns, and scores.
4. Manager reviews the pipeline and conversion rates.

**Required features**
- Lead pipeline with stages, tags, score.
- Product-interest attribution.
- Conversation history attached to each contact.
- Assignment and ownership.

**Pain points**
- Needs lead scoring that's understandable and rule-based (not a black box).
- Needs clear "won/lost" reporting to know what works.

**Expected outcomes**
- Every inbound conversation feeds the pipeline automatically.
- Reps focus on high-score leads first.
- Measurable conversion and faster follow-up.

---

### Persona 6 — Customer Support Team ("HelpDesk Crew")

**Profile.** Frontline support agents answering product/order/billing questions. Follow strict SLAs and escalation rules.

**Goals**
- Resolve common questions fast with consistent answers.
- Meet response-time SLAs.
- Escalate complex cases cleanly with full context.

**Problems**
- Repetitive answers waste time.
- No systematic status (open/pending/resolved) so cases fall through cracks.
- Escalation loses context.

**Typical workflow**
1. Inbox shows new/unresolved conversations prioritized.
2. Agent answers with templates; marks status pending/resolved.
3. Complex issue reassigned to a specialist with notes attached.
4. Manager reviews response-time metrics per agent.

**Required features**
- Status lifecycle (Open/Pending/Resolved/Awaiting-reply).
- Templates + AI reply suggestions.
- Assignment + notes + labels.
- Response-time and per-agent analytics.

**Pain points**
- SLA pressure: needs first-response-time visibility.
- Wants canned replies without making the customer feel robotic.

**Expected outcomes**
- Faster, consistent resolutions.
- No dropped conversations.
- Clear per-agent performance data.

---

### Persona 7 — Multi-Brand Business ("Apex Group")

**Profile.** One company operating several distinct brands (e.g., a home line, a fitness line), each with its own Facebook Page and tone.

**Goals**
- Manage all brands centrally with brand-specific tone and routing.
- Keep brand data and reporting separate.
- Give each brand team its own view but maintain central oversight.

**Problems**
- One shared inbox would blend brands and confuse tone.
- Central admins need oversight, but brand managers need isolation.
- Reporting must roll up per brand.

**Typical workflow**
1. One workspace with multiple Pages, each labeled by brand.
2. Filter inbox by Page/brand; assign brand-specific teammates.
3. Use brand-specific templates and tone in AI drafts.
4. Report analytics per Page/brand and rolled up.

**Required features**
- Multi-Page workspace with per-Page filtering.
- Brand-scoped labels/templates.
- Team roles with per-Page/brand assignments.
- Per-Page analytics + aggregate.

**Pain points**
- Needs clean separation of brand tone/context.
- Wants permissions granular enough to limit a rep to their brand only.

**Expected outcomes**
- Centralized management, brand-separated operations.
- Correct tone and routing per brand.
- One dashboard for group-level reporting.

---

### Persona 8 — Lead-Generation Business ("PipelinePro")

**Profile.** Generates leads for clients (real estate, home services, finance). Runs high-volume outreach and nurtures leads to a handoff point.

**Goals**
- Capture and qualify inbound leads at volume.
- Nurture leads automatically until sales-ready.
- Hand off warm leads to the client (via export or assignment).

**Problems**
- Manual qualification doesn't scale.
- Need to stay compliant while messaging many people.
- Handoff to clients is messy and untracked.

**Typical workflow**
1. Automations tag and score inbound contacts by intent.
2. Nurture sequences (drip-style, window-aware) advance leads.
3. Leads reaching "Qualified" are exported/assigned to client.
4. Track cost-per-lead and conversion from analytics.

**Required features**
- Automation engine (trigger → conditions → actions) with delays.
- Lead scoring and segmentation.
- Campaign delivery with eligibility checks.
- Export / assignment for handoff.

**Pain points**
- Must stay strictly inside Meta's window/tag rules at scale (one violation can sink a Page).
- Needs clear lead-quality metrics to prove value.

**Expected outcomes**
- Qualification largely automated.
- Consistent, compliant nurture volume.
- Measurable handoff pipeline and CPA.

---

## 2. Concrete Use-Case Scenarios

**UC-1 (Small Business Owner).** Rania connects her bakery's Page in under two minutes. A customer asks "do you do dairy-free birthday cakes?" PagePilot's AI drafts an on-brand reply with a follow-up question; Rania taps send, and the contact is automatically added to her lead list tagged "cake — dairy-free."

**UC-2 (E-commerce Seller).** A NovaThreads buyer messages "where's my order #4421?" An automation detects the order-status intent, replies with a saved template plus a note prompting the VA, who already sees the tagged, assigned conversation and resolves it without hunting for the order.

**UC-3 (Marketing Agency).** BrightFunnel's account manager opens a client workspace, sees a token-expiry warning on one Page, completes reauthorization in a few clicks, then launches a segmented campaign and exports delivery analytics for the client's monthly report.

**UC-4 (Sales Team).** During a product launch, a rep's inbox floods with questions. The unified inbox auto-creates contacts, scoring those who mention the new SKU higher. The rep works from the top of the lead pipeline and closes three deals the same day.

**UC-5 (Customer Support).** A HelpDesk agent resolves a billing dispute, marks it Resolved, then reassigns a second, complex case to a specialist with a note. The manager later pulls per-agent response-time data to staff the next shift.

**UC-6 (Multi-Brand).** Apex's brand manager filters the inbox to the fitness brand only, drafts with that brand's voice template, and assigns a rep who only has access to the fitness Page — while central admins see a rolled-up report across all brands.

**UC-7 (Lead Generation).** PipelinePro runs an automated nurture flow: a new contact with "home loan" intent is tagged, scored, and dripped a sequence over several days. On reaching "Qualified," the lead is auto-assigned to the client and logged for CPA reporting.

**UC-8 (AI Assistant, cross-persona).** A user types "Send my new collection announcement to everyone who asked about the spring line and is still within their messaging window." The assistant classifies the action as **EXTERNAL**, shows a preview with recipient count and eligibility, and only sends after explicit confirmation — excluding any recipient outside the window.
