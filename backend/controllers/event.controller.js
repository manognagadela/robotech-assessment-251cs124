import pool from "../db.js";
import sanitizeHtml from "sanitize-html";
import { isRegistrationOpen } from "../utils/registrationUtils.js";

/* =========================================================
   HTML SANITIZER CONFIG (REUSABLE)
   ========================================================= */
const sanitizeConfig = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    "h1", "h2", "h3", "h4", "h5", "h6",
    "img", "iframe",
    "table", "thead", "tbody", "tr", "th", "td"
  ]),
  allowedAttributes: {
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt"],
    iframe: ["src", "allow", "allowfullscreen", "frameborder"]
  },
  allowedSchemes: ["http", "https", "mailto"],
  enforceHtmlBoundary: true
};

/* =========================
   ADMIN: CREATE EVENT
   ========================= */
export async function createEvent(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "Banner image is required" });
  }

  const {
    title,
    short_description,
    full_description,
    venue,
    visibility,
    display_order,
    registration_enabled,
    registration_start,
    registration_end,
    external_links,
    external_registration_link,
    event_date,
    due_date
  } = req.body;

  const cleanHtml = sanitizeHtml(full_description, sanitizeConfig);

  const links =
    external_links && typeof external_links === "string"
      ? JSON.parse(external_links)
      : [];

  const { rows } = await pool.query(
    `INSERT INTO events (
        title,
        short_description,
        full_description,
        venue,
        visibility,
        display_order,
        registration_enabled,
        registration_start,
        registration_end,
        created_by,
        external_links,
        external_registration_link,
        banner_image,
        event_date,
        due_date
      )
      VALUES (
        $1,$2,$3,$4,
        $5,$6,
        $7,$8,$9,
        $10,$11,$12,$13,
        $14,$15
      )
      RETURNING id`,
    [
      title,
      short_description,
      cleanHtml,
      venue,
      visibility || "DRAFT",
      Number(display_order) || 0,
      registration_enabled === "true" || registration_enabled === true,
      registration_start || null,
      registration_end || null,
      req.admin.id,
      JSON.stringify(links),
      external_registration_link || null,
      req.file.filename,
      event_date || null,
      due_date || null
    ]
  );

  res.status(201).json({ id: rows[0].id });
}

/* =========================
   ADMIN: UPDATE EVENT
   ========================= */
export async function updateEvent(req, res) {
  const { id } = req.params;
  const fields = { ...req.body };

  if (fields.full_description) {
    fields.full_description = sanitizeHtml(
      fields.full_description,
      sanitizeConfig
    );
  }

  if (fields.registration_start === "") fields.registration_start = null;
  if (fields.registration_end === "") fields.registration_end = null;
  if (fields.event_date === "") fields.event_date = null;
  if (fields.due_date === "") fields.due_date = null;

  if (fields.external_links) {
    fields.external_links =
      typeof fields.external_links === "string"
        ? fields.external_links
        : JSON.stringify(fields.external_links);
  }

  if (req.file) {
    fields.banner_image = req.file.filename;
  }

  if (fields.display_order !== undefined) {
    fields.display_order = Number(fields.display_order) || 0;
  }

  const keys = Object.keys(fields);
  if (!keys.length) {
    return res.status(400).json({ message: "No fields to update" });
  }

  const setClause = keys.map((k, i) => `${k}=$${i + 1}`).join(", ");

  await pool.query(
    `UPDATE events SET ${setClause}, updated_at=now() WHERE id=$${keys.length + 1}`,
    [...Object.values(fields), id]
  );

  res.json({ message: "Event updated" });
}

/* =========================
   ADMIN: READ
   ========================= */
export async function getAdminEvents(req, res) {
  const { rows } = await pool.query(
    `SELECT e.*, a.email as creator_email
     FROM events e
     LEFT JOIN admins a ON e.created_by = a.id
     ORDER BY e.display_order DESC, e.created_at DESC`
  );

  res.json({ data: rows, total: rows.length });
}

export async function getAdminEventById(req, res) {
  const { id } = req.params;

  const { rows } = await pool.query(
    `SELECT * FROM events WHERE id=$1`,
    [id]
  );

  if (!rows.length) {
    return res.status(404).json({ message: "Event not found" });
  }

  const event = rows[0];

  try {
    event.external_links =
      typeof event.external_links === "string"
        ? JSON.parse(event.external_links)
        : event.external_links ?? [];
  } catch {
    event.external_links = [];
  }

  res.json(event);
}

/* =========================
   PUBLIC: EVENTS LIST
   ========================= */
export async function getPublicEvents(req, res) {
  const { rows } = await pool.query(
    `SELECT
        id,
        title,
        short_description,
        full_description,
        venue,
        banner_image,
        registration_enabled,
        registration_start,
        registration_end,
        external_links,
        external_registration_link,
        display_order
     FROM events
     WHERE visibility = 'PUBLISHED'
     ORDER BY display_order DESC, created_at DESC`
  );

  const events = rows.map(event => {
    let links = [];
    try {
      links =
        typeof event.external_links === "string"
          ? JSON.parse(event.external_links)
          : event.external_links ?? [];
    } catch {
      links = [];
    }

    return {
      ...event,
      external_links: links,
      registration_open: isRegistrationOpen(event)
    };
  });

  res.json(events);
}

/* =========================
   PUBLIC: SINGLE EVENT
   ========================= */
export async function getPublicEventById(req, res) {
  const { id } = req.params;

  const { rows } = await pool.query(
    `SELECT * FROM events WHERE id=$1 AND visibility='PUBLISHED'`,
    [id]
  );

  if (!rows.length) {
    return res.status(404).json({ message: "Event not found" });
  }

  const event = rows[0];

  try {
    event.external_links =
      typeof event.external_links === "string"
        ? JSON.parse(event.external_links)
        : event.external_links ?? [];
  } catch {
    event.external_links = [];
  }

  res.json({
    ...event,
    registration_open: isRegistrationOpen(event)
  });
}

/* =========================
   ADMIN: DELETE
   ========================= */
export async function deleteEvent(req, res) {
  const { id } = req.params;

  const { rowCount } = await pool.query(
    "DELETE FROM events WHERE id=$1",
    [id]
  );

  if (!rowCount) {
    return res.status(404).json({ message: "Event not found" });
  }

  res.json({ message: "Event deleted" });
}
