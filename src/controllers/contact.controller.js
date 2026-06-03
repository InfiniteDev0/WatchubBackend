const contactService = require("../services/contact.service");

// POST /api/contact
async function submitContact(req, res, next) {
  try {
    const { full_name, email, subject, message } = req.body;
    if (!full_name || !email || !subject || !message)
      return res.status(400).json({ error: "full_name, email, subject and message are required" });

    // user_id is optional — attach if the request is authenticated
    const user_id = req.user?.id ?? null;
    const data = await contactService.createContactMessage({
      full_name, email, subject, message, user_id,
    });
    res.status(201).json(data);
  } catch (err) { next(err); }
}

// GET /api/contact/mine — the signed-in user's own feedback + admin replies
async function getMyMessages(req, res, next) {
  try {
    const data = await contactService.getUserMessages(req.user.id);
    res.json({ messages: data });
  } catch (err) { next(err); }
}

// PATCH /api/contact/:id/read — customer marks an admin reply as read
async function markMyMessageRead(req, res, next) {
  try {
    const data = await contactService.markUserMessageRead(
      req.user.id,
      req.params.id
    );
    if (!data) return res.status(404).json({ error: "Message not found" });
    res.json(data);
  } catch (err) { next(err); }
}

module.exports = { submitContact, getMyMessages, markMyMessageRead };
