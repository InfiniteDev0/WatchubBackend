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

module.exports = { submitContact };
