import { EmailMessage, EmailAccount } from "../types/mail.entity";

const baseEmailBodyStyle = [
  "font-family: inherit",
  "color: #f8fafc",
  "line-height: 1.6",
  "font-size: 14px",
].join("; ");

const wrapEmailBody = (content: string) => `
  <div style="${baseEmailBodyStyle}">
    <style>
      p { margin: 0 0 12px; }
      h2, h3, h4 { margin: 16px 0 8px; font-weight: 600; color: #f8fafc; }
      ul, ol { margin: 0 0 12px 20px; padding: 0; }
      li { margin: 0 0 6px; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      th, td { padding: 10px; border: 1px solid rgba(248, 250, 252, 0.25); }
      th { background: #0f172a; text-align: left; }
      tfoot td { font-weight: 600; }
    </style>
    ${content.trim()}
  </div>
`;

// Mock 邮件账户
export const mockAccounts: EmailAccount[] = [
  {
    label: "Luke",
    email: "luke@synaply.com",
  },
  {
    label: "Work",
    email: "luke.work@gmail.com",
  },
];

// Mock 邮件数据
export const mockEmails: EmailMessage[] = [
  {
    id: "1",
    subject: "Q4 Project Roadmap Review",
    snippet:
      "Hi team, I wanted to share the updated roadmap for Q4. Please review the attached document and let me know your thoughts...",
    body: wrapEmailBody(`
      <p>Hi team,</p>
      <p>I wanted to share the updated roadmap for Q4. Please review the attached document and let me know your thoughts before our meeting on Friday.</p>
      <p>Key highlights:</p>
      <ul>
        <li>New feature launches planned for October</li>
        <li>Performance optimization sprint in November</li>
        <li>Year-end review and planning in December</li>
      </ul>
      <p>Looking forward to your feedback!</p>
      <p>Best regards,<br/>Alex</p>
    `),
    date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    isRead: false,
    isStarred: true,
    sender: {
      name: "Alex Johnson",
      email: "alex.johnson@synaply.team",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    },
    recipients: [{ name: "Me", email: "me@synaply.com" }],
    cc: [{ name: "Team Lead", email: "lead@synaply.com" }],
    labels: ["important"],
    folder: "inbox",
    hasAttachments: true,
    attachments: [
      {
        id: "a1",
        filename: "Q4_Roadmap.pdf",
        size: 2456000,
        contentType: "application/pdf",
      },
    ],
  },
  {
    id: "2",
    subject: "Design System Updates - Action Required",
    snippet:
      "Hello everyone, We've made significant updates to our design system. Please take a moment to review the changes...",
    body: wrapEmailBody(`
      <p>Hello everyone,</p>
      <p>We've made significant updates to our design system. Please take a moment to review the changes and update your components accordingly.</p>
      <h3>What's New:</h3>
      <ol>
        <li>Updated color palette with better accessibility</li>
        <li>New spacing tokens</li>
        <li>Revised typography scale</li>
      </ol>
      <p>The documentation has been updated at our design system portal.</p>
      <p>Thanks,<br/>Sarah</p>
    `),
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isRead: false,
    isStarred: false,
    sender: {
      name: "Sarah Chen",
      email: "sarah.chen@gmail.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    },
    recipients: [{ name: "Me", email: "me@synaply.com" }],
    cc: [
      { name: "Design Team", email: "design@synaply.com" },
      { name: "Frontend Team", email: "frontend@synaply.com" },
    ],
    folder: "inbox",
  },
  {
    id: "3",
    subject: "Weekly Standup Notes",
    snippet:
      "Here are the notes from today's standup meeting. Please review and add any items I might have missed...",
    body: wrapEmailBody(`
      <p>Hi,</p>
      <p>Here are the notes from today's standup meeting:</p>
      <h4>Completed:</h4>
      <ul>
        <li>API integration for user authentication</li>
        <li>Bug fixes for dashboard widgets</li>
      </ul>
      <h4>In Progress:</h4>
      <ul>
        <li>Email notification system</li>
        <li>Performance monitoring setup</li>
      </ul>
      <h4>Blockers:</h4>
      <ul>
        <li>Waiting for design approval on new features</li>
      </ul>
      <p>Best,<br/>Michael</p>
    `),
    date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    isRead: true,
    isStarred: false,
    sender: {
      name: "Michael Brown",
      email: "michael.brown@outlook.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    },
    recipients: [{ name: "Me", email: "me@synaply.com" }],
    folder: "inbox",
  },
  {
    id: "4",
    subject: "Invoice #INV-2024-001",
    snippet:
      "Please find attached the invoice for the services rendered in September. Payment is due within 30 days...",
    body: wrapEmailBody(`
      <p>Dear Client,</p>
      <p>Please find attached the invoice for the services rendered in September.</p>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Consulting Services</td>
            <td style="text-align: right;">$5,000.00</td>
          </tr>
          <tr>
            <td>Development Work</td>
            <td style="text-align: right;">$3,500.00</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td>Total</td>
            <td style="text-align: right;">$8,500.00</td>
          </tr>
        </tfoot>
      </table>
      <p>Payment is due within 30 days.</p>
      <p>Thank you for your business!</p>
      <p>Emily Davis<br/>Finance Department</p>
    `),
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    isRead: true,
    isStarred: true,
    sender: {
      name: "Emily Davis",
      email: "emily.davis@yahoo.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
    },
    recipients: [{ name: "Me", email: "me@synaply.com" }],
    labels: ["important"],
    folder: "inbox",
    hasAttachments: true,
    attachments: [
      {
        id: "a2",
        filename: "INV-2024-001.pdf",
        size: 156000,
        contentType: "application/pdf",
      },
    ],
  },
  {
    id: "5",
    subject: "Re: Meeting Reschedule Request",
    snippet:
      "No problem at all! Let's move it to Thursday at 3 PM. I'll send out an updated calendar invite...",
    body: wrapEmailBody(`
      <p>No problem at all!</p>
      <p>Let's move it to Thursday at 3 PM. I'll send out an updated calendar invite shortly.</p>
      <p>See you then!</p>
      <p>David</p>
    `),
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    isRead: true,
    isStarred: false,
    sender: {
      name: "David Wilson",
      email: "david.wilson@gmail.com",
      avatar: "",
    },
    recipients: [{ name: "Me", email: "me@synaply.com" }],
    folder: "inbox",
  },
  {
    id: "6",
    subject: "Project Status Update",
    snippet:
      "Hi team, here's the weekly status update for our project. We've made good progress this week...",
    body: wrapEmailBody(`
      <p>Hi team, here's the weekly status update for our project.</p>
      <ul>
        <li>Completed initial API integration</li>
        <li>Reviewed the new onboarding flow</li>
        <li>Queued performance testing for Friday</li>
      </ul>
      <p>Next update will include metrics and timelines.</p>
    `),
    date: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    isRead: true,
    isStarred: false,
    sender: { name: "Me", email: "luke@gmail.com" },
    recipients: [{ name: "Team", email: "team@example.com" }],
    folder: "sent",
  },
  {
    id: "7",
    subject: "Draft: Proposal for New Project",
    snippet:
      "Dear Client, we are pleased to present our proposal for the upcoming project...",
    body: wrapEmailBody(`
      <p>Dear Client,</p>
      <p>We are pleased to present our proposal for the upcoming project. The scope includes discovery, delivery, and post-launch support.</p>
      <p>Please let us know if you'd like any adjustments before we finalize the agreement.</p>
      <p>Warm regards,<br/>Synaply Team</p>
    `),
    date: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    isRead: true,
    isStarred: false,
    sender: { name: "Me", email: "me@synaply.com" },
    recipients: [{ name: "Client", email: "client@example.com" }],
    folder: "draft",
  },
  {
    id: "8",
    subject: "You've Won $1,000,000!!!",
    snippet:
      "Congratulations! You have been selected as the winner of our grand prize...",
    body: wrapEmailBody(`
      <h2>Congratulations!</h2>
      <p>You have been selected as the winner of our grand prize. Please confirm your details to claim the reward.</p>
      <p>If you did not enter, you can safely ignore this message.</p>
    `),
    date: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    isRead: false,
    isStarred: false,
    sender: { name: "Spam Sender", email: "spam@suspicious.com" },
    recipients: [{ name: "Me", email: "me@synaply.com" }],
    folder: "junk",
  },
  {
    id: "9",
    subject: "Old Newsletter - Archived",
    snippet: "This week's top stories and updates from around the world...",
    body: wrapEmailBody(`
      <p>This week's top stories and updates from around the world:</p>
      <ol>
        <li>Industry recap and market highlights</li>
        <li>Product updates from our partners</li>
        <li>Upcoming events and webinars</li>
      </ol>
      <p>You're receiving this because you subscribed in 2023.</p>
    `),
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    isRead: true,
    isStarred: false,
    sender: { name: "Newsletter", email: "newsletter@news.com" },
    recipients: [{ name: "Me", email: "me@synaply.com" }],
    folder: "trash",
  },
];

// 获取文件夹中的邮件
export const getEmailsByFolder = (
  emails: EmailMessage[],
  folder: string,
): EmailMessage[] => {
  return emails.filter((email) => email.folder === folder);
};

// 获取未读邮件数量
export const getUnreadCount = (
  emails: EmailMessage[],
  folder: string,
): number => {
  return emails.filter((email) => email.folder === folder && !email.isRead)
    .length;
};
