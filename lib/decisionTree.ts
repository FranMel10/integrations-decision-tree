export type TreeNode = {
  id: string;
  title: string;
  body?: string;
  checklist?: string[]; // questions to ask / things to verify at this step
  notionTopics?: string[]; // article titles to search for in Notion
  warning?: string; // important caution for the agent
  link?: { label: string; url: string };
  tags?: string[]; // who owns/handles this step: T1, Seniors, SAM, etc.
  options?: { label: string; nextId: string }[];
  isTerminal?: boolean;
};

const GENERIC_ESCALATION_CHECKLIST = [
  "Account, store and PRID",
  "Affected marketplace or provider",
  "Integration type",
  "Affected Sales Channel",
  "One or more Order IDs",
  "Date and time of the incident",
  "Screenshots (marketplace, POS or KDS)",
  "Expected result vs actual result",
  "Whether it affects one order or all orders",
  "Troubleshooting steps already taken",
];

export const decisionTree: Record<string, TreeNode> = {
  start: {
    id: "start",
    title: "Client Contacts Support",
    body: "Channel: Call / WhatsApp / Email.",
    options: [{ label: "Continue", nextId: "identify_type" }],
  },

  identify_type: {
    id: "identify_type",
    title: "Identify the integration type",
    body: "Don't assume the provider — confirm it before choosing a branch. Mixing these up is the #1 cause of wrong escalations.",
    checklist: [
      "Ask the client which marketplace, platform, or POS is involved",
      "Check Sales Channels → Marketplaces → Order Ingest to confirm the actual provider/configuration",
    ],
    notionTopics: ["Integration guides", "Integrations - Support Troubleshooting"],
    options: [
      { label: "Marketplace via UrbanPiper (Uber Eats, Deliveroo, Just Eat)", nextId: "up_which_issue" },
      { label: "Direct marketplace (Just Eat Direct, Deliveroo Direct, Uber Eats Direct)", nextId: "direct_which_marketplace" },
      { label: "External POS integration (Lightspeed, Deliverect, Otter, etc.)", nextId: "external_pos" },
      { label: "Last-mile / delivery (Uber Direct, Glovo, Stuart, DoorDash...)", nextId: "delivery_which_provider" },
      { label: "New integration or disintegration request", nextId: "new_or_disintegration" },
    ],
  },

  // ══════════════════ A. Marketplace via UrbanPiper ══════════════════
  up_which_issue: {
    id: "up_which_issue",
    title: "Marketplace via UrbanPiper",
    body: "Uber Eats, Deliveroo, or Just Eat routed through UrbanPiper. What's the specific issue?",
    notionTopics: ["3rd party order management (Urban Piper)", "3rd Party Order Management (Urban Piper) - troubleshooting"],
    options: [
      { label: "Orders not arriving to POS/till", nextId: "up_orders_not_arriving" },
      { label: "Opening hours", nextId: "up_opening_hours" },
      { label: "Auto-accept orders", nextId: "up_auto_accept" },
      { label: "Disintegration request", nextId: "disintegration_decision" },
    ],
  },
  up_orders_not_arriving: {
    id: "up_orders_not_arriving",
    title: "Orders not arriving to POS/till (UrbanPiper)",
    checklist: [
      "Does the order appear in Sales Reports?",
      "Is Order Ingest enabled?",
      "Does the order appear in Atlas?",
      "Is there an error in Activity History → Response Payload?",
      "Did republishing the menu resolve it?",
      "If it appears in Sales Reports but doesn't print: check Sales Channel → POS/KDS assignment and printing config (this is not an UrbanPiper failure)",
    ],
    notionTopics: ["3rd Party Order Management (Urban Piper) - troubleshooting"],
    warning: "Don't mention UrbanPiper to the client during ordinary troubleshooting — present it as a marketplace integration investigation. Exception: when the disintegration flow requires direct client confirmation.",
    options: [
      { label: "Issue Fixed?", nextId: "resolved_confirm" },
      { label: "Still not fixed — escalate", nextId: "up_orders_escalate" },
    ],
  },
  up_orders_escalate: {
    id: "up_orders_escalate",
    title: "Escalate: orders not arriving (UrbanPiper)",
    body: "Open the 'Report an Issue' workflow in #urbanpiper-flipdish-support.",
    checklist: [
      "Atlas Business ID",
      "Atlas Location Name/ID",
      "Affected marketplace",
      "Order IDs",
      "Date and time",
      "Screenshots",
      "Response Payload error",
      "Publishes performed",
      "Test order result",
    ],
    tags: ["Seniors", "UrbanPiper"],
    options: [{ label: "Continue", nextId: "inform_client" }],
  },
  up_opening_hours: {
    id: "up_opening_hours",
    title: "Opening hours (UrbanPiper)",
    checklist: [
      "Update the opening hours on the corresponding Sales Channel",
      "Save the hours",
      "Confirm the schedule was created/assigned in Atlas",
      "Manually publish the location in Atlas",
      "If multiple marketplaces share the same POS ID, avoid creating duplicate schedules from several Sales Channels",
      "If the restaurant is closing a full day, it may need to be created directly in Atlas",
    ],
    notionTopics: ["How to update opening hours for marketplaces", "Setting Hour Override on Marketplaces - Uber Eats & Deliveroo only"],
    options: [
      { label: "Issue Fixed?", nextId: "resolved_confirm" },
      { label: "Still not fixed — escalate", nextId: "up_hours_escalate" },
    ],
  },
  up_hours_escalate: {
    id: "up_hours_escalate",
    title: "Escalate: opening hours (UrbanPiper)",
    checklist: GENERIC_ESCALATION_CHECKLIST,
    tags: ["Seniors", "UrbanPiper"],
    options: [{ label: "Continue", nextId: "inform_client" }],
  },
  up_auto_accept: {
    id: "up_auto_accept",
    title: "Auto-accept orders (UrbanPiper)",
    body: "Route depends on which marketplace is behind UrbanPiper.",
    checklist: [
      "Just Eat via UrbanPiper → request the change through UrbanPiper",
      "Uber Eats via UrbanPiper → request the change through UrbanPiper",
      "Deliveroo via UrbanPiper → the client can contact their Deliveroo Account Manager",
    ],
    notionTopics: ["3rd Party Order Management (Urban Piper) - troubleshooting"],
    warning: "Auto-accept doesn't necessarily mean the order can be accepted/rejected from the Flipdish POS. Depending on the marketplace, acceptance and dispatch changes may still require the marketplace's own device.",
    options: [{ label: "Continue", nextId: "resolved_confirm" }],
  },

  // ══════════════════ B. Direct marketplaces ══════════════════
  direct_which_marketplace: {
    id: "direct_which_marketplace",
    title: "Direct marketplace",
    body: "Not routed through UrbanPiper — the marketplace connects straight to Flipdish. Which one?",
    options: [
      { label: "Just Eat Direct", nextId: "jed_which_issue" },
      { label: "Deliveroo Direct", nextId: "deliveroo_direct_which_issue" },
      { label: "Uber Eats Direct integration (not Uber Direct delivery)", nextId: "uber_eats_direct_note" },
    ],
  },

  jed_which_issue: {
    id: "jed_which_issue",
    title: "Just Eat Direct",
    checklist: [
      "Go to Sales Channels → Marketplaces → Just Eat",
      "Open Order Ingest and check the provider/configuration",
      "If it's confirmed as direct, do NOT look for the order in Atlas",
    ],
    notionTopics: ["Just Eat Direct Troubleshooting", "Just Eat (direct) <> POS integration"],
    options: [
      { label: "Orders not arriving", nextId: "jed_orders_not_arriving" },
      { label: "Opening hours", nextId: "jed_opening_hours" },
      { label: "Auto-accept orders", nextId: "jed_auto_accept" },
      { label: "Disintegration request", nextId: "disintegration_decision" },
    ],
  },
  jed_orders_not_arriving: {
    id: "jed_orders_not_arriving",
    title: "Just Eat Direct — orders not arriving",
    checklist: [
      "Confirm the order doesn't appear in Sales Reports",
      "Confirm the integration is enabled",
      "Publish the menu",
      "Check the publish was successful",
      "If still not arriving: make a small real menu change, publish again, then revert and publish again",
      "If it appears in Sales Reports but doesn't print: check the Sales Channel → POS/KDS assignment",
    ],
    notionTopics: ["Just Eat Direct Troubleshooting"],
    options: [
      { label: "Issue Fixed?", nextId: "resolved_confirm" },
      { label: "Still not fixed — escalate", nextId: "jed_escalate_orders" },
    ],
  },
  jed_escalate_orders: {
    id: "jed_escalate_orders",
    title: "Escalate to Just Eat",
    body: "Expected initial response time: approx. 5–7 business days (can vary).",
    checklist: [
      "Market: UK or IE",
      "JET ID",
      "Order IDs",
      "Dates and times",
      "Detailed description",
      "Screenshots",
      "Publishes performed",
      "CC Integrations",
    ],
    tags: ["Seniors", "Just Eat"],
    options: [{ label: "Continue", nextId: "inform_client" }],
  },
  jed_opening_hours: {
    id: "jed_opening_hours",
    title: "Just Eat Direct — opening hours",
    checklist: [
      "Sales Channels → Marketplaces → Just Eat → Opening Hours",
      "Save — this should trigger a publish",
      "Check Publishing Logs",
      "Hours crossing midnight may need to be split, e.g. 16:00–23:59 and 00:00–01:00 the next day",
    ],
    notionTopics: ["Just Eat Direct Troubleshooting"],
    options: [
      { label: "Issue Fixed?", nextId: "resolved_confirm" },
      { label: "Still not fixed — escalate", nextId: "jed_escalate_orders" },
    ],
  },
  jed_auto_accept: {
    id: "jed_auto_accept",
    title: "Just Eat Direct — auto-accept",
    body: "The client must contact their Just Eat Account Manager or Just Eat Support.",
    checklist: [
      "Alternatively, Support can email jetconnectsupport@justeattakeaway.com, but this is normally slower",
    ],
    notionTopics: ["Just Eat Direct Troubleshooting", "Just Eat (direct) <> POS integration"],
    options: [{ label: "Continue", nextId: "resolved_confirm" }],
  },

  deliveroo_direct_which_issue: {
    id: "deliveroo_direct_which_issue",
    title: "Deliveroo Direct",
    notionTopics: ["Deliveroo (Direct) <> POS integration"],
    options: [
      { label: "Opening hours", nextId: "deliveroo_direct_hours" },
      { label: "Auto-accept orders", nextId: "deliveroo_direct_auto_accept" },
      { label: "Other issue", nextId: "deliveroo_direct_other" },
      { label: "Disintegration request", nextId: "disintegration_decision" },
    ],
  },
  deliveroo_direct_hours: {
    id: "deliveroo_direct_hours",
    title: "Deliveroo Direct — opening hours",
    body: "Review the integration/Partner Hub configuration.",
    notionTopics: ["Setting Hour Override on Marketplaces - Uber Eats & Deliveroo only", "Deliveroo (Direct) <> POS integration"],
    options: [
      { label: "Issue Fixed?", nextId: "resolved_confirm" },
      { label: "Still not fixed — escalate", nextId: "deliveroo_direct_escalate" },
    ],
  },
  deliveroo_direct_auto_accept: {
    id: "deliveroo_direct_auto_accept",
    title: "Deliveroo Direct — auto-accept",
    body: "Auto-accept is configured from Deliveroo's own device/ecosystem, not from Flipdish.",
    notionTopics: ["Deliveroo (Direct) <> POS integration"],
    options: [{ label: "Continue", nextId: "resolved_confirm" }],
  },
  deliveroo_direct_other: {
    id: "deliveroo_direct_other",
    title: "Deliveroo Direct — other issue",
    notionTopics: ["Deliveroo (Direct) <> POS integration"],
    options: [
      { label: "Issue Fixed?", nextId: "resolved_confirm" },
      { label: "Still not fixed — escalate", nextId: "deliveroo_direct_escalate" },
    ],
  },
  deliveroo_direct_escalate: {
    id: "deliveroo_direct_escalate",
    title: "Escalate: Deliveroo Direct",
    checklist: GENERIC_ESCALATION_CHECKLIST,
    tags: ["Seniors", "Deliveroo"],
    options: [{ label: "Continue", nextId: "inform_client" }],
  },

  uber_eats_direct_note: {
    id: "uber_eats_direct_note",
    title: "Uber Eats Direct integration",
    warning: "Do not confuse this with Uber Direct delivery — Uber Eats Direct is a marketplace integration, Uber Direct is a last-mile delivery service. Confirm which one the client actually means before proceeding.",
    notionTopics: ["Integration guides", "Integrations - Support Troubleshooting"],
    options: [
      { label: "It's actually Uber Eats marketplace — continue", nextId: "resolved_confirm" },
      { label: "It's actually Uber Direct delivery", nextId: "uber_direct_which_issue" },
      { label: "Escalate to confirm setup", nextId: "generic_escalate" },
    ],
  },

  // ══════════════════ C. External POS ══════════════════
  external_pos: {
    id: "external_pos",
    title: "External POS integration troubleshooting",
    body: "POS partners: Lightspeed, Oracle Micros Res3700, Flipdish Windows App, PAR PixelPoint, Captiva, Restaurant Manager. Middleware/integration partners: Deliverect, Otter, ItsACheckmate, BistroHub, Ordatic, Omnivore, Sinqro.",
    checklist: [
      "Which external POS does the client use?",
      "Who built/manages the integration?",
      "Does it affect menus, orders, accept/reject, printing, or pricing/modifiers?",
      "Is the integration still active?",
      "Did the order reach Flipdish?",
      "Who accepted or rejected the order?",
    ],
    notionTopics: [
      "Integrations - Support Troubleshooting",
      "Lightspeed (L) - Troubleshooting",
      "Oracle Micros Res3700 - Troubleshooting",
      "Flipdish Windows App (WIP) (aka POS App)",
      "PAR PixelPoint (CBE / Slowey / etc)",
      "Captiva - Troubleshooting",
      "Restaurant Manager (WIP) - Troubleshooting",
      "Deliverect - Troubleshooting",
      "Otter - Troubleshooting",
      "ItsACheckmate (WIP) - Troubleshooting",
      "BistroHub (WIP) - Troubleshooting",
      "Ordatic (WIP) - Troubleshooting",
      "Omnivore (WIP) - Troubleshooting",
      "Sinqro (WIP) - Troubleshooting",
    ],
    warning: "Use Metabase and Datadog to check whether an order was accepted or rejected by an integration. Don't blindly trust the 'reject reason' — some integrators send generic or hardcoded values.",
    options: [
      { label: "Issue Fixed?", nextId: "resolved_confirm" },
      { label: "Still not fixed — escalate", nextId: "external_pos_escalate" },
    ],
  },
  external_pos_escalate: {
    id: "external_pos_escalate",
    title: "Escalate: external POS integration",
    checklist: [
      "Account, store and PRID",
      "External POS",
      "Integration partner",
      "Order IDs",
      "Date/time",
      "User agent (if available)",
      "Order status",
      "Exact error",
      "Logs",
      "Screenshots",
      "Steps already taken",
      "Expected vs actual result",
    ],
    tags: ["Seniors", "Integrations"],
    options: [{ label: "Continue", nextId: "inform_client" }],
  },

  // ══════════════════ D. Last-mile / delivery ══════════════════
  delivery_which_provider: {
    id: "delivery_which_provider",
    title: "Last-mile / delivery",
    options: [
      { label: "Uber Direct", nextId: "uber_direct_which_issue" },
      { label: "Glovo", nextId: "glovo_which_issue" },
      { label: "Other provider (Stuart, DoorDash, Vromo, etc.)", nextId: "other_delivery_provider" },
    ],
  },

  uber_direct_which_issue: {
    id: "uber_direct_which_issue",
    title: "Uber Direct",
    notionTopics: ["Uber Direct - Troubleshooting", "Uber Direct UK & I FAQ", "(Uber Direct) Refund process"],
    options: [
      { label: "Client wants another driver assigned", nextId: "uber_direct_new_driver" },
      { label: "Delivery failed / order not delivered", nextId: "uber_direct_investigation" },
    ],
  },
  uber_direct_new_driver: {
    id: "uber_direct_new_driver",
    title: "Uber Direct — assign another driver",
    checklist: [
      "Confirm this is really Uber Direct, not the Uber Eats marketplace",
      "Get the Flipdish Order ID",
      "Check status and tracking",
      "If there's still time and the delivery hasn't been picked up, Support can manually request another driver",
    ],
    warning: "If the order already finished, was cancelled, or wasn't delivered, move to the investigation/compensation process instead. Don't send the client directly to Uber — Support manages the relevant communication.",
    notionTopics: ["Uber Direct - Troubleshooting"],
    options: [{ label: "Continue", nextId: "resolved_confirm" }],
  },
  uber_direct_investigation: {
    id: "uber_direct_investigation",
    title: "Uber Direct — delivery failed / order not delivered",
    notionTopics: ["Uber Direct - Troubleshooting", "(Uber Direct) Refund process"],
    checklist: [
      "Get the Flipdish Order ID",
      "Check delivery status and tracking",
      "Determine if a refund applies per the standard refund process",
    ],
    options: [
      { label: "Issue Fixed?", nextId: "resolved_confirm" },
      { label: "Still not fixed — escalate", nextId: "generic_escalate" },
    ],
  },

  glovo_which_issue: {
    id: "glovo_which_issue",
    title: "Glovo",
    notionTopics: ["Glovo - Troubleshooting", "Glovo Business 1"],
    warning: "Glovo's pages contain historical sections and some potentially contradictory instructions about 'Flipdish Managed' accounts. Don't copy old credentials or processes — always confirm who currently manages the account first.",
    checklist: [
      "Who currently manages the Glovo account — the client directly, or a special/legacy setup?",
      "Was the delivery job created?",
      "Was a driver assigned?",
      "Is the order still active?",
      "Is the problem related to zone/address?",
    ],
    options: [
      { label: "Client's own account → they manage rider/compensation with Glovo directly", nextId: "glovo_client_managed" },
      { label: "Special/legacy setup → escalate to confirm the process", nextId: "generic_escalate" },
      { label: "Delivery request rejected", nextId: "glovo_rejected" },
      { label: "Driver didn't arrive", nextId: "glovo_driver_no_show" },
      { label: "Compensation requested", nextId: "glovo_compensation" },
    ],
  },
  glovo_client_managed: {
    id: "glovo_client_managed",
    title: "Glovo — client-managed account",
    body: "The client has their own relationship with Glovo and should use their own dashboard/channels to request another rider.",
    warning: "Don't promise that Support can assign another driver until the account type is confirmed.",
    options: [{ label: "Continue", nextId: "resolved_confirm" }],
  },
  glovo_rejected: {
    id: "glovo_rejected",
    title: "Glovo — delivery request rejected",
    checklist: [
      "Review Order ID and error",
      "Verify pickup and delivery address",
      "Confirm both are within Glovo's zone",
      "Adjust Flipdish zones when they don't match",
      "Create a manual delivery if appropriate",
    ],
    options: [
      { label: "Issue Fixed?", nextId: "resolved_confirm" },
      { label: "Still not fixed — escalate", nextId: "generic_escalate" },
    ],
  },
  glovo_driver_no_show: {
    id: "glovo_driver_no_show",
    title: "Glovo — driver didn't arrive",
    checklist: [
      "Review the delivery in the corresponding dashboard",
      "If there's still time, attempt a new delivery",
      "If not possible, inform operational alternatives and document the result",
    ],
    options: [{ label: "Continue", nextId: "resolved_confirm" }],
  },
  glovo_compensation: {
    id: "glovo_compensation",
    title: "Glovo — compensation",
    body: "The consumer refund can be processed following the normal process. Food/service compensation from Glovo is handled between the restaurant and Glovo when the restaurant has its own account/agreement.",
    warning: "Flipdish should not automatically promise compensation.",
    options: [{ label: "Continue", nextId: "resolved_confirm" }],
  },

  other_delivery_provider: {
    id: "other_delivery_provider",
    title: "Other delivery provider (Stuart, DoorDash, Vromo, etc.)",
    warning: "Flipdish Support should not promise another driver for any integration. The ability to do so depends on the provider and whether Flipdish manages the integration.",
    options: [
      { label: "Continue", nextId: "generic_escalate" },
    ],
  },

  // ══════════════════ E. New integration / disintegration ══════════════════
  new_or_disintegration: {
    id: "new_or_disintegration",
    title: "New integration or disintegration request",
    options: [
      { label: "New integration request", nextId: "new_integration" },
      { label: "Disintegration request", nextId: "disintegration_decision" },
    ],
  },

  new_integration: {
    id: "new_integration",
    title: "New integration request",
    checklist: [
      "Does the client want to integrate Flipdish Online Ordering with their external POS?",
      "Do they want to integrate marketplaces with the Flipdish POS?",
      "Is this a delivery/driver management integration?",
      "Is this a new client onboarding or an existing client?",
      "Is the commercial side already approved?",
    ],
    body: "Sales/Success handles commercial terms first. Legacy/partner POS integrations → use the Integration Request Form. Marketplaces inside Flipdish POS → request via Salesforce or during onboarding. Inform the client that Integrations will take over the process once the request is complete.",
    notionTopics: ["Integration guides"],
    options: [{ label: "Continue", nextId: "new_integration_data" }],
  },
  new_integration_data: {
    id: "new_integration_data",
    title: "Minimum data required",
    checklist: [
      "Salesforce account",
      "Restaurant name and location",
      "Current POS",
      "Type of integration requested",
      "Marketplace URLs",
      "Menu to be used",
      "Opening hours",
      "Own drivers or marketplace drivers",
      "Technical/commercial contact",
      "Expected go-live date",
    ],
    body: "Expected timelines — UrbanPiper: ~5–10 business days. Marketplaces via UrbanPiper: ~5–15 days depending on platform. Just Eat Direct: ~7–10 business days. Deliveroo Direct: ~2–5 business days.",
    tags: ["Sales/Success", "Integrations"],
    isTerminal: true,
    options: [{ label: "Continue", nextId: "inform_client" }],
  },

  disintegration_decision: {
    id: "disintegration_decision",
    title: "Disintegration request",
    notionTopics: [
      "Support - Integrations process",
      "3rd Party Order Management (Urban Piper) - troubleshooting",
      "Just Eat Direct Troubleshooting",
      "Just Eat (direct) <> POS integration",
    ],
    options: [
      { label: "Temporary pause", nextId: "disintegration_temporary" },
      { label: "Permanently remove the integration", nextId: "disintegration_churn_check" },
    ],
  },
  disintegration_temporary: {
    id: "disintegration_temporary",
    title: "Temporary pause",
    body: "Do not process this as a disintegration.",
    checklist: [
      "Use Property Snooze when appropriate (normally max 24 hours)",
      "Manually confirm the marketplace shows as closed",
      "For long pauses, involve Integrations to avoid having to rebuild the integration later",
    ],
    tags: ["T1"],
    isTerminal: true,
    options: [{ label: "Continue", nextId: "inform_client" }],
  },
  disintegration_churn_check: {
    id: "disintegration_churn_check",
    title: "Is this permanent and related to price, service, or repeated incidents?",
    warning: "This replaces the old generic 'possible churn indicator' box — always ask this question explicitly for permanent disintegration requests.",
    options: [
      { label: "Yes — possible churn risk", nextId: "disintegration_churn_escalate" },
      { label: "No — continue with the standard process", nextId: "disintegration_permanent_setup" },
    ],
  },
  disintegration_churn_escalate: {
    id: "disintegration_churn_escalate",
    title: "Escalate to SAM/CSM before completing the disintegration",
    tags: ["Escalations", "SAM", "⚠️ Possible churn"],
    isTerminal: true,
    options: [{ label: "Continue", nextId: "inform_client" }],
  },
  disintegration_permanent_setup: {
    id: "disintegration_permanent_setup",
    title: "Permanent disintegration — before acting",
    checklist: [
      "Confirm the request comes from the account owner",
      "Record the reason",
      "Confirm affected marketplaces and properties",
      "Get SAM/CSM approval per the current process",
      "Warn the client the process may be permanent and they'll regain menu control once disintegration completes",
    ],
    options: [
      { label: "UrbanPiper", nextId: "disintegration_urbanpiper" },
      { label: "Just Eat Direct", nextId: "disintegration_jed" },
      { label: "Other integration", nextId: "disintegration_other" },
    ],
  },
  disintegration_urbanpiper: {
    id: "disintegration_urbanpiper",
    title: "Disintegration — UrbanPiper",
    body: "Expected timeline: approx. 24–48 business hours.",
    checklist: [
      "Create the request via the #urbanpiper-flipdish-support workflow",
      "Include Atlas Account Name and Business ID",
      "Uber Eats may require the client's email",
      "Deliveroo — the client may need to disconnect UrbanPiper from Partner Hub",
      "Disable Order Ingest only following the applicable process and approvals",
    ],
    tags: ["Seniors", "UrbanPiper"],
    isTerminal: true,
    options: [{ label: "Continue", nextId: "inform_client" }],
  },
  disintegration_jed: {
    id: "disintegration_jed",
    title: "Disintegration — Just Eat Direct",
    body: "Expected timeline: approx. 1–5 business days.",
    checklist: [
      "Get the JET ID",
      "Contact jetconnectsupport@justeattakeaway.com",
      "Disable Menu Ingest and Order Ingest per procedure",
    ],
    tags: ["Seniors", "Just Eat"],
    isTerminal: true,
    options: [{ label: "Continue", nextId: "inform_client" }],
  },
  disintegration_other: {
    id: "disintegration_other",
    title: "Disintegration — other integrations",
    body: "The method varies — check the Support - Integrations process table.",
    checklist: [
      "Some are disabled from the App Store",
      "Some are removed from Admin",
      "Some require carefully removing the integration user from Teammates",
      "Uber Direct may also require updating delivery fees",
      "Glovo requires first checking how the account is managed",
    ],
    notionTopics: ["Support - Integrations process"],
    tags: ["Seniors", "Integrations"],
    isTerminal: true,
    options: [{ label: "Continue", nextId: "inform_client" }],
  },

  // ══════════════════ Shared / generic nodes ══════════════════
  generic_escalate: {
    id: "generic_escalate",
    title: "Escalate with full evidence",
    checklist: GENERIC_ESCALATION_CHECKLIST,
    tags: ["Seniors"],
    options: [{ label: "Continue", nextId: "inform_client" }],
  },

  resolved_confirm: {
    id: "resolved_confirm",
    title: "Issue Fixed — before closing",
    checklist: [
      "Confirm the result with the client",
      "Explain what was fixed",
      "Request a test order if appropriate",
      "Confirm the test order appears in Sales Reports",
      "Confirm it reaches the POS/KDS",
      "Confirm it prints correctly",
      "Document the steps taken",
    ],
    isTerminal: true,
    options: [{ label: "Continue", nextId: "inform_client" }],
  },

  inform_client: {
    id: "inform_client",
    title: "✓ Inform Client",
    body: "Standardized close-out — cover all five before ending the case:",
    checklist: [
      "Action taken",
      "Result",
      "Limitation (if any)",
      "Who owns it next",
      "ETA communicated to the client",
    ],
    isTerminal: true,
  },
};

export const START_NODE_ID = "start";
