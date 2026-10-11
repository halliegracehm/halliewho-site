// Everything you might want to change lives here.
// Edit a value, commit, and Vercel rebuilds the whole site.

export default {
  siteUrl: "https://halliewho.com",
  siteName: "Hallie Who",
  tagline: "The sister you never had but always wanted.",

  // Products and links
  journalUrl: "https://pages-for-you-hallie.vercel.app",
  journalPrice: "$12",
  linksHub: "https://links.halliewho.com",
  innerGroveUrl: "https://myinnergrove.halliewho.com",

  // TODO: paste your real links here. Until you do, these buttons go to your links hub.
  appStoreUrl: "",      // My Inner Mind app on the App Store
  podcastUrl: "",       // My Inner Mind podcast (YouTube channel)
  instagramUrl: "",

  // Where "Work with me" inquiries go.
  contactEmail: "halliegracehm@gmail.com",

  // Books (shown on /books). Add a buyUrl when a book is for sale and the
  // button switches from "Get notified" to "Buy the book".
  bookLaunchSignup: "https://mailchi.mp/460a5b0c7915/book-launch-signup",
  books: [
    {
      title: "Underneath a Large Leafy Tree",
      kind: "Children's picture book",
      blurb: "Meet Flamie the owl. A picture book for little ones about finding your place under a big, leafy tree, illustrated by Crystal.",
      status: "Coming soon",
      buyUrl: ""
    },
    {
      title: "What Are You",
      kind: "Memoir",
      blurb: "My story of growing up adopted in a big Alabama family, the question people kept asking me, and what it took to finally answer it for myself.",
      status: "In progress",
      buyUrl: ""
    }
  ],

  // Conversations (shown on /talk-with-hallie). Booking links come from Cal.com.
  // Leave bookings empty ([]) and the button opens an email to you instead.
  talkHours: "Monday through Wednesday evenings, and weekends",
  talks: [
    {
      name: "10 Minute Talk",
      price: "$25",
      length: "10 minutes, by phone",
      what: "A quick reset when you need to talk something through, a little encouragement before a hard conversation, a check-in to keep you accountable, or help making a decision.",
      bookings: [{ label: "Book a time", url: "https://cal.com/halliewho/15min" }]
    },
    {
      name: "Deep Conversation",
      price: "$85",
      length: "50 minutes, by phone or video",
      what: "Room to slow down and work through what's heavy: overwhelm, burnout, relationship stress, a life transition, or planning your next season. Afterward I email you a few reflection questions and any resources that fit.",
      bookings: [{ label: "Book a time", url: "https://cal.com/halliewho/deepconversation" }]
    },
    {
      name: "Walk & Talk",
      price: "$45 by phone, $60 in person",
      length: "25 minutes",
      what: "A casual conversation while we walk. By phone, we each walk wherever we are. In person, we meet at a public park or trail near Birmingham. Good for feeling stuck, lonely, burned out, or ready to build a new routine.",
      bookings: [{ label: "Book by phone", url: "https://cal.com/halliewho/walkandtalk" }, { label: "Book in person", url: "https://cal.com/halliewho/walk-and-talk-in-person" }]
    },
    {
      name: "Monthly Accountability",
      price: "$125 a month",
      length: "Two 25-minute calls a month",
      what: "We set goals together, track your habits, and check in on how you're really doing. Includes voice note support between calls.",
      bookings: [{ label: "Book your first call", url: "https://cal.com/halliewho/monthly-accountability" }]
    }
  ],

  // Starting prices for the done-for-you services (shown on /work-with-me)
  services: [
    {
      name: "Quiz funnel, done for you",
      price: "Starting at $350",
      what: "A branded personality-style quiz for your audience: questions, result types, result copy, and email capture wired to your Mailchimp so every quiz taker joins your list.",
      gets: ["Up to 10 questions and 4 result types", "Result pages written in your voice", "Email capture connected to your list", "Ready to share in your bio and stories"]
    },
    {
      name: "Lead magnet page",
      price: "Starting at $150",
      what: "One simple page that trades a free download, checklist, or printable for an email address.",
      gets: ["Page design and copy", "Mailchimp signup connected", "QR code for events and tables"]
    },
    {
      name: "Instagram DM automation",
      price: "Starting at $125",
      what: "Someone comments a keyword, they get your link in their DMs automatically.",
      gets: ["Up to 3 keyword flows", "Message copy written for you", "Connected to your freebie or offer"]
    }
  ],

  // Mailchimp (from your existing quiz form)
  mailchimp: {
    action: "https://halliewho.us17.list-manage.com/subscribe/post?u=bbff5252f50b2b7e50b580971&id=0c7f1c8258&f_id=0020e1e3f0",
    botField: "b_bbff5252f50b2b7e50b580971_0c7f1c8258",
    // Create an audience field with this merge tag in Mailchimp to see each person's result.
    // Until it exists, Mailchimp simply ignores it.
    resultField: "QUIZRES"
  }
};
