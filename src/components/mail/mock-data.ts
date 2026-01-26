import { EmailMessage, EmailAccount } from "./types";

// Mock 邮件账户
export const mockAccounts: EmailAccount[] = [
  {
    label: "Luke",
    email: "luke@synaply.com",
  },
  {
    label: "Work",
    email: "luke.work@company.com",
  },
];

// Mock 邮件数据
export const mockEmails: EmailMessage[] = [
  {
    id: "1",
    subject: "Q4 Project Roadmap Review",
    snippet: "Hi team, I wanted to share the updated roadmap for Q4. Please review the attached document and let me know your thoughts...",
    body: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6;">
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
      </div>
    `,
    date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    unread: true,
    sender: { name: "Alex Johnson", email: "alex.johnson@example.com" },
    recipients: [{ name: "Me", email: "me@synaply.com" }],
    labels: ["important"],
    folder: "inbox",
    hasAttachments: true,
    attachments: [
      { id: "a1", filename: "Q4_Roadmap.pdf", size: 2456000, contentType: "application/pdf" },
    ],
  },
  {
    id: "2",
    subject: "Design System Updates - Action Required",
    snippet: "Hello everyone, We've made significant updates to our design system. Please take a moment to review the changes...",
    body: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6;">
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
      </div>
    `,
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    unread: true,
    sender: { name: "Sarah Chen", email: "sarah.chen@example.com" },
    recipients: [{ name: "Me", email: "me@synaply.com" }],
    folder: "inbox",
  },
  {
    id: "3",
    subject: "Weekly Standup Notes",
    snippet: "Here are the notes from today's standup meeting. Please review and add any items I might have missed...",
    body: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6;">
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
      </div>
    `,
    date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    unread: false,
    sender: { name: "Michael Brown", email: "michael.brown@example.com" },
    recipients: [{ name: "Me", email: "me@synaply.com" }],
    folder: "inbox",
  },
  {
    id: "4",
    subject: "Invoice #INV-2024-001",
    snippet: "Please find attached the invoice for the services rendered in September. Payment is due within 30 days...",
    body: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6;">
        <p>Dear Client,</p>
        <p>Please find attached the invoice for the services rendered in September.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <tr style="background: #f5f5f5;">
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Description</th>
            <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Amount</th>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Consulting Services</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$5,000.00</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Development Work</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$3,500.00</td>
          </tr>
          <tr style="font-weight: bold;">
            <td style="padding: 10px; border: 1px solid #ddd;">Total</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$8,500.00</td>
          </tr>
        </table>
        <p>Payment is due within 30 days.</p>
        <p>Thank you for your business!</p>
        <p>Emily Davis<br/>Finance Department</p>
      </div>
    `,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    unread: false,
    sender: { name: "Emily Davis", email: "emily.davis@example.com" },
    recipients: [{ name: "Me", email: "me@synaply.com" }],
    labels: ["important"],
    folder: "inbox",
    hasAttachments: true,
    attachments: [
      { id: "a2", filename: "INV-2024-001.pdf", size: 156000, contentType: "application/pdf" },
    ],
  },
  {
    id: "5",
    subject: "Re: Meeting Reschedule Request",
    snippet: "No problem at all! Let's move it to Thursday at 3 PM. I'll send out an updated calendar invite...",
    body: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6;">
        <p>No problem at all!</p>
        <p>Let's move it to Thursday at 3 PM. I'll send out an updated calendar invite shortly.</p>
        <p>See you then!</p>
        <p>David</p>
      </div>
    `,
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    unread: false,
    sender: { name: "David Wilson", email: "david.wilson@example.com" },
    recipients: [{ name: "Me", email: "me@synaply.com" }],
    folder: "inbox",
  },
  {
    id: "6",
    subject: "Project Status Update",
    snippet: "Hi team, here's the weekly status update for our project. We've made good progress this week...",
    body: `<p>Hi team, here's the weekly status update...</p>`,
    date: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    unread: false,
    sender: { name: "Me", email: "me@synaply.com" },
    recipients: [{ name: "Team", email: "team@example.com" }],
    folder: "sent",
  },
  {
    id: "7",
    subject: "Draft: Proposal for New Project",
    snippet: "Dear Client, we are pleased to present our proposal for the upcoming project...",
    body: `<p>Dear Client, we are pleased to present our proposal...</p>`,
    date: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    unread: false,
    sender: { name: "Me", email: "me@synaply.com" },
    recipients: [{ name: "Client", email: "client@example.com" }],
    folder: "draft",
  },
  {
    id: "8",
    subject: "You've Won $1,000,000!!!",
    snippet: "Congratulations! You have been selected as the winner of our grand prize...",
    body: `<h1 style="color: red;">CONGRATULATIONS!!!</h1><p>You have been selected...</p>`,
    date: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    unread: false,
    sender: { name: "Spam Sender", email: "spam@suspicious.com" },
    recipients: [{ name: "Me", email: "me@synaply.com" }],
    folder: "junk",
  },
  {
    id: "9",
    subject: "Old Newsletter - Archived",
    snippet: "This week's top stories and updates from around the world...",
    body: `<p>This week's top stories...</p>`,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    unread: false,
    sender: { name: "Newsletter", email: "newsletter@news.com" },
    recipients: [{ name: "Me", email: "me@synaply.com" }],
    folder: "trash",
  },
];

// 获取文件夹中的邮件
export const getEmailsByFolder = (emails: EmailMessage[], folder: string): EmailMessage[] => {
  return emails.filter((email) => email.folder === folder);
};

// 获取未读邮件数量
export const getUnreadCount = (emails: EmailMessage[], folder: string): number => {
  return emails.filter((email) => email.folder === folder && email.unread).length;
};
