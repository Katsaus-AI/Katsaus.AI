/**
 * Firebase Cloud Functions for Katsaus.AI
 * 
 * This module will contain serverless backend functions deployed to Firebase.
 * 
 * Planned Functions:
 * - Scheduled scraper: Daily news fetch from JYU website
 * - Admin API endpoints: Message CRUD operations with authentication
 * - Analytics: Usage statistics and reporting
 * - Notifications: Push notifications for important messages
 * 
 * Current Status:
 * - Placeholder implementation with demo "hello" function
 * - Ready for deployment infrastructure
 * - Awaiting Firebase project configuration
 * 
 * Development:
 * - Build: npm run build (compiles TypeScript to lib/)
 * - Test locally: npm run serve (starts emulator)
 * - Deploy: npm run deploy
 * - Tests: npm test
 * 
 * Architecture:
 * - Uses Firebase Functions v2 (onRequest, onSchedule, etc.)
 * - TypeScript for type safety
 * - Express-style request/response patterns
 * 
 * Security:
 * - Use Firebase Admin SDK for privileged Firestore access
 * - Implement authentication checks for admin endpoints
 * - Validate all input data
 * - Use environment variables for sensitive config
 */

import { onRequest } from "firebase-functions/v2/https";
import type { Request, Response } from "express";
import * as cheerio from "cheerio";
import { createHash } from "crypto";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

type ScrapedNewsItem = {
  Title: string;
  Date: string;
  Description: string;
  Link: string;
  Image: string;
  Category: string;
};

type StoredNewsItem = ScrapedNewsItem & {
  syncedAt: string;
  source: string;
  rawDescription?: string;
  summary?: string;
  summaryModel?: string;
};

type UserProfile = {
  orgId?: string;
  desiredScrapers?: string[];
};

type UserNewsItem = StoredNewsItem & {
  ownerId: string;
  orgId: string;
};

const JYU_NEWS_URL = "https://www.jyu.fi/fi/ajankohtaista/uutiset-ja-tiedotteet";
const JYU_BASE_URL = "https://www.jyu.fi";
const NEWS_COLLECTION = "uutiset";
const USER_NEWS_REFRESH_MINUTES = 60;
const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";
const ALLOWED_CATEGORIES = [
  "uutisia",
  "tutkimus",
  "yritysyhteistyö",
  "opintohallinto",
  "hr",
  "johto",
  "tuotekehitys",
  "it-tuki",
  "turvallisuus",
  "jyu",
  "aalto",
  "helsinki",
  "tampere",
  "turku",
  "oulu",
  "uef",
  "lut",
  "abo-akademi",
  "hanken",
  "lapland",
  "vaasa",
  "uniarts",
];
const EXTERNAL_RSS_SOURCES = [
  {
    id: "aalto",
    titlePrefix: "Aalto",
    url: "https://www.aalto.fi/en/news/feed",
    category: "aalto",
  },
  {
    id: "helsinki",
    titlePrefix: "Helsingin yliopisto",
    url: "https://www.helsinki.fi/rss.xml",
    category: "helsinki",
  },
  {
    id: "tampere",
    titlePrefix: "Tampereen yliopisto",
    url: "https://news.google.com/rss/search?q=site:tuni.fi+Tampereen+yliopisto&hl=fi&gl=FI&ceid=FI:fi",
    category: "tampere",
  },
  {
    id: "turku",
    titlePrefix: "Turun yliopisto",
    url: "https://www.utu.fi/rss",
    category: "turku",
  },
  {
    id: "oulu",
    titlePrefix: "Oulun yliopisto",
    url: "https://news.google.com/rss/search?q=site:oulu.fi+Oulun+yliopisto&hl=fi&gl=FI&ceid=FI:fi",
    category: "oulu",
  },
  {
    id: "uef",
    titlePrefix: "Itä-Suomen yliopisto",
    url: "https://news.google.com/rss/search?q=site:uef.fi+It%C3%A4-Suomen+yliopisto&hl=fi&gl=FI&ceid=FI:fi",
    category: "uef",
  },
  {
    id: "lut",
    titlePrefix: "LUT-yliopisto",
    url: "https://news.google.com/rss/search?q=site:lut.fi+LUT-yliopisto&hl=fi&gl=FI&ceid=FI:fi",
    category: "lut",
  },
  {
    id: "abo-akademi",
    titlePrefix: "Abo Akademi",
    url: "https://www.abo.fi/en/news/feed",
    category: "abo-akademi",
  },
  {
    id: "hanken",
    titlePrefix: "Hanken",
    url: "https://news.google.com/rss/search?q=site:hanken.fi+Hanken&hl=fi&gl=FI&ceid=FI:fi",
    category: "hanken",
  },
  {
    id: "lapland",
    titlePrefix: "Lapin yliopisto",
    url: "https://www.ulapland.fi/feed",
    category: "lapland",
  },
  {
    id: "vaasa",
    titlePrefix: "Vaasan yliopisto",
    url: "https://www.uwasa.fi/rss.xml",
    category: "vaasa",
  },
  {
    id: "uniarts",
    titlePrefix: "Taideyliopisto",
    url: "https://news.google.com/rss/search?q=site:uniarts.fi+Taideyliopisto&hl=fi&gl=FI&ceid=FI:fi",
    category: "uniarts",
  },
  {
    id: "yle",
    titlePrefix: "YLE",
    url: "https://feeds.yle.fi/uutiset/v1/majorHeadlines/YLE_UUTISET.rss",
    category: "uutisia",
  },
  {
    id: "bbc",
    titlePrefix: "BBC",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    category: "uutisia",
  },
];

if (getApps().length === 0) {
  initializeApp();
}

const firestore = getFirestore();
const adminAuth = getAuth();

const TEST_ORGANIZATIONS = [
  {
    id: "org-alpha",
    name: "Alpha Labs",
    description: "Testiorganisaatio Alpha",
  },
  {
    id: "org-beta",
    name: "Beta Works",
    description: "Testiorganisaatio Beta",
  },
  {
    id: "org-gamma",
    name: "Gamma Research",
    description: "Testiorganisaatio Gamma",
  },
  {
    id: "org-delta",
    name: "Delta Services",
    description: "Testiorganisaatio Delta",
  },
];

const TEST_USERS = [
  {
    email: "alpha.admin@example.com",
    password: "Testi123!",
    displayName: "Alpha Admin",
    orgId: "org-alpha",
    desiredScrapers: ["jyu", "atlassian", "yle", "bbc"],
    isAdmin: true,
  },
  {
    email: "alpha.viewer@example.com",
    password: "Testi123!",
    displayName: "Alpha Viewer",
    orgId: "org-alpha",
    desiredScrapers: ["jyu", "yle"],
    isAdmin: false,
  },
  {
    email: "beta.admin@example.com",
    password: "Testi123!",
    displayName: "Beta Admin",
    orgId: "org-beta",
    desiredScrapers: ["jyu", "atlassian", "bbc"],
    isAdmin: true,
  },
  {
    email: "beta.viewer@example.com",
    password: "Testi123!",
    displayName: "Beta Viewer",
    orgId: "org-beta",
    desiredScrapers: ["jyu", "helsinki", "tampere"],
    isAdmin: false,
  },
  {
    email: "gamma.admin@example.com",
    password: "Testi123!",
    displayName: "Gamma Admin",
    orgId: "org-gamma",
    desiredScrapers: ["jyu", "aalto", "turku", "uef", "lut"],
    isAdmin: true,
  },
  {
    email: "gamma.viewer@example.com",
    password: "Testi123!",
    displayName: "Gamma Viewer",
    orgId: "org-gamma",
    desiredScrapers: ["jyu", "oulu", "lapland", "vaasa"],
    isAdmin: false,
  },
  {
    email: "delta.admin@example.com",
    password: "Testi123!",
    displayName: "Delta Admin",
    orgId: "org-delta",
    desiredScrapers: ["jyu", "abo-akademi", "hanken", "uniarts", "atlassian"],
    isAdmin: true,
  },
  {
    email: "delta.viewer@example.com",
    password: "Testi123!",
    displayName: "Delta Viewer",
    orgId: "org-delta",
    desiredScrapers: ["jyu", "yle", "bbc"],
    isAdmin: false,
  },
];

function isFunctionsEmulator(): boolean {
  return process.env.FUNCTIONS_EMULATOR === "true";
}

function toAbsoluteUrl(value: string, baseUrl: string): string {
  if (!value) return "";
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

async function scrapeJyuNews(): Promise<ScrapedNewsItem[]> {
  const response = await fetch(JYU_NEWS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch JYU news: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const items: ScrapedNewsItem[] = [];

  $("a.teaser").each((_index, element) => {
    const teaser = $(element);
    const title = teaser.find("h3.heading").first().text().trim() || "No title";
    const date = teaser.find(".published-date").first().text().trim() || "No date";
    const description = teaser.find(".field-description").first().text().trim() || "No description";
    const link = toAbsoluteUrl(teaser.attr("href") || "", JYU_BASE_URL);
    const imageSource = teaser.find(".field-media-image img").first().attr("src") || "";
    const image = toAbsoluteUrl(imageSource, JYU_BASE_URL);

    items.push({
      Title: title,
      Date: date,
      Description: description,
      Link: link,
      Image: image,
      Category: "jyu",
    });
  });

  return items;
}

function toStoredNewsItem(item: ScrapedNewsItem, source: string): StoredNewsItem {
  const sourceCategoryMap: Record<string, string> = {
    jyu: "jyu",
    atlassian: "atlassian",
    yle: "yle",
    bbc: "bbc",
  };

  return {
    ...item,
    Category: sourceCategoryMap[source.toLowerCase()] || source.toLowerCase(),
    source,
    syncedAt: new Date().toISOString(),
    rawDescription: item.Description,
    summary: item.Description,
    summaryModel: process.env.GEMINI_API_KEY ? (process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL) : "heuristic",
  };
}

function createNewsDocId(item: ScrapedNewsItem): string {
  const basis = item.Link || `${item.Title}-${item.Date}`;
  return createHash("sha256").update(basis).digest("hex");
}

async function loadNewsFromFirestore(): Promise<StoredNewsItem[]> {
  const snapshot = await firestore.collection(NEWS_COLLECTION).get();
  const docs = snapshot.docs as unknown as Array<{ data: () => StoredNewsItem }>;

  return docs
    .map((newsDoc: { data: () => StoredNewsItem }) => newsDoc.data())
    .sort((left, right) => {
      const leftTime = Date.parse(left.syncedAt || left.Date || "");
      const rightTime = Date.parse(right.syncedAt || right.Date || "");
      return rightTime - leftTime;
    });
}

async function saveNewsToFirestore(items: ScrapedNewsItem[], source: string): Promise<void> {
  const storedItems = items.map((item) => toStoredNewsItem(item, source));
  await saveStoredNewsToFirestore(storedItems);
}

async function saveStoredNewsToFirestore(items: StoredNewsItem[]): Promise<void> {
  await Promise.all(
    items.map((item) => {
      const reference = firestore.collection(NEWS_COLLECTION).doc(createNewsDocId(item));
      return reference.set(item, { merge: true });
    })
  );
}

function parseTimestamp(value: string | undefined): number {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function isCacheFresh(items: StoredNewsItem[]): boolean {
  if (items.length === 0) return false;
  const latest = items.reduce((currentLatest, item) => {
    const candidate = parseTimestamp(item.syncedAt || item.Date || "");
    return Math.max(currentLatest, candidate);
  }, 0);
  if (latest === 0) return false;
  const ageMinutes = (Date.now() - latest) / 60000;
  return ageMinutes < USER_NEWS_REFRESH_MINUTES;
}

function normalizeText(value: string): string {
  return value
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00A0/g, " ")
    .trim();
}

function stripHtml(value: string): string {
  return cheerio.load(value).text().replace(/\s+/g, " ").trim();
}

function inferCategory(text: string): string {
  const lower = text.toLowerCase();
  const keywordMap: Array<[string, RegExp[]]> = [
    ["it-tuki", [/incident/, /ticket/, /support/, /bug/, /error/, /incident/i, /tuki/]],
    ["hr", [/rekrytointi/, /työsuhde/, /palkka/, /hr/, /vacancy/, /hiring/]],
    ["johto", [/strategy/, /johto/, /board/, /tilannekatsaus/, /management/]],
    ["tuotekehitys", [/release/, /feature/, /development/, /tuotekeh/, /roadmap/]],
    ["turvallisuus", [/security/, /vulnerability/, /incident response/, /turvallisuus/]],
    ["tutkimus", [/research/, /study/, /tutkimus/, /publication/]],
    ["yritysyhteistyö", [/partner/, /yhteistyö/, /collaboration/, /customer/]],
    ["opintohallinto", [/opinto/, /student/, /course/, /curriculum/, /ops/]],
  ];

  for (const [category, patterns] of keywordMap) {
    if (patterns.some((pattern) => pattern.test(lower))) {
      return category;
    }
  }

  return "uutisia";
}

function normalizeCategory(candidate: string | undefined, fallbackText: string): string {
  const normalized = (candidate || "").toLowerCase().trim();
  if (ALLOWED_CATEGORIES.includes(normalized)) {
    return normalized;
  }
  return inferCategory(fallbackText);
}

function getAtlassianConfig() {
  const url = process.env.ATLASSIAN_URL;
  const username = process.env.ATLASSIAN_USERNAME;
  const apiToken = process.env.ATLASSIAN_API_TOKEN;

  if (!url || !username || !apiToken) {
    return null;
  }

  return { url, username, apiToken };
}

function getAtlassianHeaders(username: string, apiToken: string): HeadersInit {
  const token = Buffer.from(`${username}:${apiToken}`).toString("base64");
  return {
    Authorization: `Basic ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

async function fetchJiraProjects(config: NonNullable<ReturnType<typeof getAtlassianConfig>>): Promise<Array<{ key: string; name: string }>> {
  const endpoint = new URL("/rest/api/3/project/search", config.url);
  endpoint.searchParams.set("maxResults", "100");

  const response = await fetch(endpoint, {
    headers: getAtlassianHeaders(config.username, config.apiToken),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Jira projects: ${response.status}`);
  }

  const payload = await response.json() as { values?: Array<{ key: string; name: string }> };
  return Array.isArray(payload.values) ? payload.values : [];
}

async function fetchJiraIssuesForProject(
  config: NonNullable<ReturnType<typeof getAtlassianConfig>>,
  projectKey: string
): Promise<Array<{ key: string; summary: string; status: string }>> {
  const endpoint = new URL("/rest/api/3/search", config.url);
  endpoint.searchParams.set("jql", `project = \"${projectKey}\" AND updated >= -7d ORDER BY updated DESC`);
  endpoint.searchParams.set("maxResults", "5");
  endpoint.searchParams.set("fields", "summary,status");

  const response = await fetch(endpoint, {
    headers: getAtlassianHeaders(config.username, config.apiToken),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Jira issues for ${projectKey}: ${response.status}`);
  }

  const payload = await response.json() as { issues?: Array<{ key: string; fields?: { summary?: string; status?: { name?: string } } }> };
  return (payload.issues || []).map((issue) => ({
    key: issue.key,
    summary: issue.fields?.summary || "No summary",
    status: issue.fields?.status?.name || "Unknown",
  }));
}

async function fetchConfluencePages(
  config: NonNullable<ReturnType<typeof getAtlassianConfig>>
): Promise<Array<{ title: string; id: string; link: string; fullContent: string }>> {
  const endpoint = new URL("/wiki/rest/api/content", config.url);
  endpoint.searchParams.set("spaceKey", "DEV");
  endpoint.searchParams.set("type", "page");
  endpoint.searchParams.set("limit", "30");
  endpoint.searchParams.set("expand", "body.storage,version");

  const response = await fetch(endpoint, {
    headers: getAtlassianHeaders(config.username, config.apiToken),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Confluence pages: ${response.status}`);
  }

  const payload = await response.json() as { results?: Array<{ title: string; id: string; body?: { storage?: { value?: string } }; _links?: { webui?: string } }> };

  return (payload.results || []).map((page) => ({
    title: page.title,
    id: page.id,
    link: page._links?.webui ? `${config.url}${page._links.webui}` : config.url,
    fullContent: stripHtml(page.body?.storage?.value || "").slice(0, 100000),
  }));
}

async function summarizeWithGemini(title: string, content: string): Promise<{ summary: string; category: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      summary: normalizeText(content).slice(0, 280) || title,
      category: inferCategory(`${title} ${content}`),
    };
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const prompt = [
    "You are distilling Atlassian updates into a teletext-style news item in Finnish.",
    "Return only valid JSON with keys summary and category.",
    "Allowed categories: uutisia, tutkimus, yritysyhteistyö, opintohallinto, hr, johto, tuotekehitys, it-tuki, turvallisuus.",
    `Title: ${title}`,
    `Content: ${content}`,
    "Rules: summary must be concise, factual, and <= 280 characters.",
  ].join("\n");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    return {
      summary: normalizeText(content).slice(0, 280) || title,
      category: inferCategory(`${title} ${content}`),
    };
  }

  const payload = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";

  try {
    const parsed = JSON.parse(text) as { summary?: string; category?: string };
    return {
      summary: normalizeText(parsed.summary || content).slice(0, 280) || title,
      category: (parsed.category || inferCategory(`${title} ${content}`)).toLowerCase(),
    };
  } catch {
    return {
      summary: normalizeText(text || content).slice(0, 280) || title,
      category: inferCategory(`${title} ${content}`),
    };
  }
}

async function summarizeAndCategorizeItems(items: ScrapedNewsItem[]): Promise<ScrapedNewsItem[]> {
  const summarized: ScrapedNewsItem[] = [];

  for (const item of items) {
    const cleanedDescription = normalizeText(stripHtml(item.Description || ""));
    const cleanedTitle = normalizeText(item.Title || "");

    // Keep short items lightweight; summarize long items and always normalize category.
    if (cleanedDescription.length <= 260) {
      summarized.push({
        ...item,
        Title: cleanedTitle || item.Title,
        Description: cleanedDescription,
        Category: normalizeCategory(item.Category, `${cleanedTitle} ${cleanedDescription}`),
      });
      continue;
    }

    const distilled = await summarizeWithGemini(cleanedTitle, cleanedDescription);
    summarized.push({
      ...item,
      Title: cleanedTitle || item.Title,
      Description: normalizeText(distilled.summary || cleanedDescription).slice(0, 280),
      Category: normalizeCategory(distilled.category || item.Category, `${cleanedTitle} ${cleanedDescription}`),
    });
  }

  return summarized;
}

async function scrapeAtlassianNews(): Promise<ScrapedNewsItem[]> {
  const config = getAtlassianConfig();
  if (!config) {
    return [];
  }

  const articles: ScrapedNewsItem[] = [];

  try {
    const projects = await fetchJiraProjects(config);

    for (const project of projects) {
      const issues = await fetchJiraIssuesForProject(config, project.key);
      for (const issue of issues) {
        const recentActivity = `${project.key}: ${project.name}\n${issues.map((item) => `${item.key}: ${item.summary} (${item.status})`).join("\n")}`;
        const distilled = await summarizeWithGemini(`${project.key}: ${project.name}`, recentActivity);

        articles.push({
          Title: `${project.key}: ${project.name}`,
          Date: "Just now",
          Description: distilled.summary,
          Link: `${config.url}/browse/${issue.key}`,
          Image: "",
          Category: distilled.category,
        });
        break;
      }
    }
  } catch (error) {
    console.warn("Jira scraping failed:", error);
  }

  try {
    const pages = await fetchConfluencePages(config);
    for (const page of pages) {
      const distilled = await summarizeWithGemini(page.title, page.fullContent);
      articles.push({
        Title: `Wiki: ${page.title}`,
        Date: "Just now",
        Description: distilled.summary,
        Link: page.link,
        Image: "",
        Category: distilled.category,
      });
    }
  } catch (error) {
    console.warn("Confluence scraping failed:", error);
  }

  return articles.map((item) => ({
    ...item,
    Description: normalizeText(item.Description),
  }));
}

async function scrapeRssFeed(source: {
  id: string;
  titlePrefix: string;
  url: string;
  category: string;
}): Promise<ScrapedNewsItem[]> {
  const response = await fetch(source.url, {
    headers: {
      "User-Agent": "KatsausAI/1.0 (+https://katsaus.ai)",
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed ${source.id}: ${response.status}`);
  }

  const xml = await response.text();
  const $ = cheerio.load(xml, { xmlMode: true });
  const items: ScrapedNewsItem[] = [];

  $("item").slice(0, 20).each((_index, element) => {
    const rssItem = $(element);
    const title = normalizeText(rssItem.find("title").first().text() || "No title");
    const link = normalizeText(rssItem.find("link").first().text() || "");
    const published = normalizeText(rssItem.find("pubDate").first().text() || "");
    const rawDescription = rssItem.find("description").first().text() || "";
    const description = normalizeText(stripHtml(rawDescription || "No description"));

    items.push({
      Title: `${source.titlePrefix}: ${title}`,
      Date: published || "Just now",
      Description: description,
      Link: link,
      Image: "",
      Category: source.category,
    });
  });

  if (items.length === 0) {
    $("entry").slice(0, 20).each((_index, element) => {
      const atomItem = $(element);
      const title = normalizeText(atomItem.find("title").first().text() || "No title");
      const link = normalizeText(
        atomItem.find("link[rel='alternate']").first().attr("href") ||
        atomItem.find("link").first().attr("href") ||
        atomItem.find("id").first().text() ||
        ""
      );
      const published = normalizeText(
        atomItem.find("updated").first().text() ||
        atomItem.find("published").first().text() ||
        ""
      );
      const rawDescription =
        atomItem.find("summary").first().text() ||
        atomItem.find("content").first().text() ||
        "";
      const description = normalizeText(stripHtml(rawDescription || "No description"));

      items.push({
        Title: `${source.titlePrefix}: ${title}`,
        Date: published || "Just now",
        Description: description,
        Link: link,
        Image: "",
        Category: source.category,
      });
    });
  }

  return items;
}

async function syncUserFeeds(items: StoredNewsItem[]): Promise<void> {
  const usersSnapshot = await firestore.collection("users").get();

  await Promise.all(
    usersSnapshot.docs.map(async (userDoc) => {
      const profile = userDoc.data() as UserProfile;
      const desiredScrapers = Array.isArray(profile.desiredScrapers) && profile.desiredScrapers.length > 0
        ? profile.desiredScrapers
        : ["jyu"];
      const allowedSources = new Set(desiredScrapers.map((source) => source.toLowerCase()));
      const orgId = profile.orgId || "default-org";

      const allowedItems = items.filter((item) => {
        const itemSource = (item.source || "").toLowerCase();
        const normalizedSource = itemSource === "scraper" ? "jyu" : itemSource;
        const itemCategory = (item.Category || "").toLowerCase();
        return allowedSources.has(normalizedSource) || allowedSources.has(itemCategory);
      });

      const feedRef = firestore.collection("users").doc(userDoc.id).collection("news");
      const existingSnapshot = await feedRef.get();
      const nextIds = new Set(allowedItems.map((item) => createNewsDocId(item)));
      const batch = firestore.batch();

      existingSnapshot.docs.forEach((docSnap) => {
        if (!nextIds.has(docSnap.id)) {
          batch.delete(docSnap.ref);
        }
      });

      allowedItems.forEach((item) => {
        const storedItem: UserNewsItem = {
          ...item,
          ownerId: userDoc.id,
          orgId,
          syncedAt: item.syncedAt || new Date().toISOString(),
        };
        batch.set(feedRef.doc(createNewsDocId(item)), storedItem, { merge: true });
      });

      if (!existingSnapshot.empty || allowedItems.length > 0) {
        await batch.commit();
      }
    })
  );
}

async function collectNewsItems(): Promise<StoredNewsItem[]> {
  const collected: StoredNewsItem[] = [];

  try {
    const jyuItems = await scrapeJyuNews();
    const summarizedJyu = await summarizeAndCategorizeItems(jyuItems);
    collected.push(...summarizedJyu.map((item) => toStoredNewsItem(item, "jyu")));
  } catch (error) {
    console.warn("Could not scrape JYU news:", error);
  }

  try {
    const atlassianItems = await scrapeAtlassianNews();
    const summarizedAtlassian = await summarizeAndCategorizeItems(atlassianItems);
    collected.push(...summarizedAtlassian.map((item) => toStoredNewsItem(item, "atlassian")));
  } catch (error) {
    console.warn("Could not scrape Atlassian news:", error);
  }

  for (const rssSource of EXTERNAL_RSS_SOURCES) {
    try {
      const rssItems = await scrapeRssFeed(rssSource);
      const summarizedRss = await summarizeAndCategorizeItems(rssItems);
      collected.push(...summarizedRss.map((item) => toStoredNewsItem(item, rssSource.id)));
    } catch (error) {
      console.warn(`Could not scrape ${rssSource.id.toUpperCase()} RSS:`, error);
    }
  }

  return collected.sort((left, right) => parseTimestamp(right.syncedAt) - parseTimestamp(left.syncedAt));
}

/**
 * Demo HTTP function to verify deployment.
 * 
 * Endpoint: https://<region>-<project-id>.cloudfunctions.net/hello
 * 
 * Returns: JSON message indicating functions are ready
 * 
 * @example
 * curl https://us-central1-myproject.cloudfunctions.net/hello
 * // {"message":"Katsaus AI – functions ready"}
 */
export const hello = onRequest((_req: Request, res: Response) => {
  res.json({ message: "Katsaus AI – functions ready" });
});

/**
 * Scrapes the JYU news page and returns a JSON payload compatible with the frontend.
 *
 * Endpoint: /api/uutiset via Firebase Hosting rewrite or the direct Cloud Function URL.
 */
export const uutiset = onRequest(async (req: Request, res: Response) => {
  try {
    let items: StoredNewsItem[] = [];
    const forceRefresh = req.query.refresh === "1" || req.query.refresh === "true";
    let shouldRefresh = true;

    try {
      items = await loadNewsFromFirestore();
      shouldRefresh = forceRefresh || !isCacheFresh(items);
    } catch (readError) {
      console.warn("Could not read news from Firestore, falling back to scrape:", readError);
    }

    if (items.length === 0 || shouldRefresh || forceRefresh) {
      items = await collectNewsItems();

      try {
        await saveStoredNewsToFirestore(items);
      } catch (writeError) {
        console.warn("Could not store scraped news to Firestore:", writeError);
      }
    }

    try {
      await syncUserFeeds(items);
    } catch (syncError) {
      console.warn("Could not sync user feeds:", syncError);
    }

    res.set("Cache-Control", "no-store");
    res.json(items);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

/**
 * Seeds local Firebase emulators with test organizations and test users.
 *
 * Endpoint: /seedTestTenants (local emulator only)
 */
export const seedTestTenants = onRequest(async (req: Request, res: Response) => {
  if (!isFunctionsEmulator()) {
    res.status(403).json({ error: "Seeding is only allowed in Firebase emulators." });
    return;
  }

  if (req.method !== "POST" && req.method !== "GET") {
    res.status(405).json({ error: "Use GET or POST." });
    return;
  }

  try {
    const organizationBatch = firestore.batch();
    TEST_ORGANIZATIONS.forEach((organization) => {
      const orgRef = firestore.collection("organizations").doc(organization.id);
      organizationBatch.set(orgRef, {
        ...organization,
        createdAt: new Date().toISOString(),
      }, { merge: true });
    });
    await organizationBatch.commit();

    const seededUsers: Array<{ email: string; uid: string; orgId: string; password: string }> = [];

    for (const user of TEST_USERS) {
      let account;
      try {
        account = await adminAuth.getUserByEmail(user.email);
      } catch {
        account = await adminAuth.createUser({
          email: user.email,
          password: user.password,
          displayName: user.displayName,
          emailVerified: true,
        });
      }

      await firestore.collection("users").doc(account.uid).set({
        email: user.email,
        displayName: user.displayName,
        orgId: user.orgId,
        desiredScrapers: user.desiredScrapers,
        isAdmin: Boolean(user.isAdmin),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      seededUsers.push({
        email: user.email,
        uid: account.uid,
        orgId: user.orgId,
        password: user.password,
      });
    }

    res.json({
      ok: true,
      organizations: TEST_ORGANIZATIONS,
      users: seededUsers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

