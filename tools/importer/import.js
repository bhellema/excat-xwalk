/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * AbbVie Stories Page Importer
 * Imports content from abbvie.com/who-we-are/our-stories.html to AEM Edge Delivery Services
 * Uses xwalk block structures for Universal Editor compatibility
 */

/**
 * Creates a table element for xwalk blocks
 * Xwalk blocks use specific table structures that differ from standard document-based blocks
 * @param {string} blockName - Name of the block
 * @param {Array<Array<any>>} rows - Array of row data, where each row is an array of cell values
 * @param {number} columns - Number of columns (1 for Hero, 2 for Cards, etc.)
 * @returns {HTMLTableElement}
 */
function createBlockTable(blockName, rows, columns = 2) {
  const table = document.createElement('table');

  // First row: block name and variants
  const headerRow = table.insertRow();
  const headerCell = headerRow.insertCell();
  headerCell.textContent = blockName;
  if (columns === 2) {
    headerRow.insertCell(); // Add empty cell for 2-column blocks
  }

  // Content rows
  rows.forEach((rowData) => {
    const row = table.insertRow();
    rowData.forEach((cellData, index) => {
      if (index < columns) {
        const cell = row.insertCell();
        if (cellData instanceof HTMLElement) {
          cell.appendChild(cellData);
        } else if (typeof cellData === 'string') {
          cell.innerHTML = cellData;
        } else if (cellData) {
          cell.appendChild(cellData);
        }
      }
    });
    // Fill remaining columns if needed
    while (row.cells.length < columns) {
      row.insertCell();
    }
  });

  return table;
}

/**
 * Parses the hero/featured story section
 * Maps to Hero xwalk block (1 column, 3 rows)
 * @param {Document} document
 * @returns {HTMLElement}
 */
function parseFeaturedStory(document) {
  const heroSection = document.querySelector('region');
  if (!heroSection) return null;

  const link = heroSection.querySelector('a[href*="our-stories"]');
  if (!link) return null;

  // Extract content
  const category = heroSection.querySelector('heading[level="2"]')?.textContent || '';
  const title = heroSection.querySelector('heading[level="4"]')?.textContent || '';
  const date = heroSection.querySelector('generic[class*="date"]')?.textContent ||
               Array.from(heroSection.querySelectorAll('generic')).find(el =>
                 /\w+ \d+, \d{4}/.test(el.textContent))?.textContent || '';
  const readTime = heroSection.querySelector('generic[ref*="e48"]')?.textContent || '';
  const url = link.getAttribute('href') || '';

  // Create background image element (would need actual image extraction)
  const bgImage = document.createElement('img');
  bgImage.src = './media_placeholder_hero.png'; // Placeholder - actual image would be extracted
  bgImage.alt = title;

  // Create content div
  const content = document.createElement('div');
  if (date) {
    const dateEl = document.createElement('p');
    dateEl.className = 'date';
    dateEl.textContent = date;
    content.appendChild(dateEl);
  }
  if (category) {
    const categoryEl = document.createElement('h2');
    categoryEl.textContent = category;
    content.appendChild(categoryEl);
  }
  if (title) {
    const titleEl = document.createElement('h4');
    titleEl.textContent = title;
    content.appendChild(titleEl);
  }
  if (readTime || url) {
    const ctaDiv = document.createElement('div');
    if (readTime) {
      const readTimeEl = document.createElement('span');
      readTimeEl.textContent = readTime;
      ctaDiv.appendChild(readTimeEl);
    }
    if (url) {
      const linkEl = document.createElement('a');
      linkEl.href = url;
      linkEl.textContent = 'Read story';
      ctaDiv.appendChild(linkEl);
    }
    content.appendChild(ctaDiv);
  }

  // Create Hero block table (1 column, 3 rows)
  const heroTable = createBlockTable('Hero', [
    [bgImage],
    [content]
  ], 1);

  return heroTable;
}

/**
 * Parses the video section
 * Maps to Hero xwalk block with video variant
 * @param {Document} document
 * @returns {HTMLElement}
 */
function parseVideoSection(document) {
  // Find the "Beyond the Possible" section
  const videoSection = Array.from(document.querySelectorAll('generic'))
    .find(el => {
      const heading = el.querySelector('heading[level="2"]');
      return heading && heading.textContent.includes('Beyond the Possible');
    });

  if (!videoSection) return null;

  const title = videoSection.querySelector('heading[level="2"]')?.textContent || '';
  const description = videoSection.querySelector('paragraph')?.textContent || '';
  const button = videoSection.querySelector('button');
  const buttonText = button?.textContent || 'Watch 7:04';

  // Create video thumbnail (placeholder)
  const thumbnail = document.createElement('img');
  thumbnail.src = './media_placeholder_video.png';
  thumbnail.alt = title;

  // Create content
  const content = document.createElement('div');
  if (title) {
    const titleEl = document.createElement('h2');
    titleEl.textContent = title;
    content.appendChild(titleEl);
  }
  if (description) {
    const descEl = document.createElement('p');
    descEl.textContent = description;
    content.appendChild(descEl);
  }
  if (buttonText) {
    const btnEl = document.createElement('a');
    btnEl.href = '#video'; // Placeholder
    btnEl.className = 'button';
    btnEl.textContent = buttonText;
    content.appendChild(btnEl);
  }

  // Create Hero block table with video variant
  const videoTable = createBlockTable('Hero (video)', [
    [thumbnail],
    [content]
  ], 1);

  return videoTable;
}

/**
 * Parses the recent stories cards section
 * Maps to Cards xwalk block (2 columns, N rows)
 * @param {Document} document
 * @returns {HTMLElement}
 */
function parseRecentStories(document) {
  const storiesList = document.querySelector('list[ref="e93"]');
  if (!storiesList) return null;

  const storyItems = storiesList.querySelectorAll('listitem');
  const cardRows = [];

  storyItems.forEach((item) => {
    const link = item.querySelector('link');
    if (!link) return;

    const url = link.getAttribute('href') || '';
    const dateCategory = item.querySelector('generic[ref*="e"]')?.textContent || '';
    const title = item.querySelector('heading[level="4"]')?.textContent || '';
    const readTime = Array.from(item.querySelectorAll('generic'))
      .find(el => el.textContent.includes('Minute Read'))?.textContent || '';

    // Create image placeholder
    const img = document.createElement('img');
    img.src = './media_placeholder_story.png';
    img.alt = title;

    // Create card content
    const cardContent = document.createElement('div');

    if (dateCategory) {
      const metaEl = document.createElement('p');
      metaEl.className = 'card-meta';
      metaEl.textContent = dateCategory;
      cardContent.appendChild(metaEl);
    }

    if (title) {
      const titleEl = document.createElement('h4');
      const titleLink = document.createElement('a');
      titleLink.href = url;
      titleLink.textContent = title;
      titleEl.appendChild(titleLink);
      cardContent.appendChild(titleEl);
    }

    if (readTime) {
      const readTimeEl = document.createElement('p');
      readTimeEl.className = 'read-time';
      readTimeEl.textContent = readTime;
      cardContent.appendChild(readTimeEl);
    }

    cardRows.push([img, cardContent]);
  });

  // Create Cards block table (2 columns, N rows)
  const cardsTable = createBlockTable('Cards', cardRows, 2);

  return cardsTable;
}

/**
 * Parses the recent news section
 * Maps to Cards xwalk block (2 columns, N rows) with simpler structure
 * @param {Document} document
 * @returns {HTMLElement}
 */
function parseRecentNews(document) {
  // Find recent news section
  const newsSection = Array.from(document.querySelectorAll('generic'))
    .find(el => {
      const heading = el.querySelector('heading[level="3"]');
      return heading && heading.textContent.includes('Recent News');
    });

  if (!newsSection) return null;

  const newsLinks = newsSection.querySelectorAll('link[href*="news.abbvie.com"]');
  const newsRows = [];

  newsLinks.forEach((link) => {
    const date = link.querySelector('generic')?.textContent || '';
    const title = link.querySelector('paragraph')?.textContent || '';
    const url = link.getAttribute('href') || '';

    // For news, we don't need images - use empty cell
    const emptyCell = document.createElement('div');

    // Create news content
    const newsContent = document.createElement('div');

    if (date) {
      const dateEl = document.createElement('p');
      dateEl.className = 'news-date';
      dateEl.textContent = date;
      newsContent.appendChild(dateEl);
    }

    if (title) {
      const titleEl = document.createElement('p');
      const titleLink = document.createElement('a');
      titleLink.href = url;
      titleLink.textContent = title;
      titleEl.appendChild(titleLink);
      newsContent.appendChild(titleEl);
    }

    newsRows.push([emptyCell, newsContent]);
  });

  // Create Cards block table for news
  const newsTable = createBlockTable('Cards (news)', newsRows, 2);

  return newsTable;
}

/**
 * Main transform function called by the import process
 * @param {Document} document - The parsed document
 * @param {string} url - The source URL
 * @returns {Array} - Array of elements to be converted to markdown
 */
export default function transform(document, url) {
  const results = [];

  // Parse and add each section
  const featuredStory = parseFeaturedStory(document);
  if (featuredStory) {
    results.push(featuredStory);
  }

  const videoSection = parseVideoSection(document);
  if (videoSection) {
    results.push(videoSection);
  }

  const recentStories = parseRecentStories(document);
  if (recentStories) {
    // Add section heading
    const storiesHeading = document.createElement('h2');
    storiesHeading.textContent = 'Recent Stories';
    results.push(storiesHeading);
    results.push(recentStories);
  }

  const recentNews = parseRecentNews(document);
  if (recentNews) {
    // Add section heading
    const newsHeading = document.createElement('h2');
    newsHeading.textContent = 'Recent News';
    results.push(newsHeading);
    results.push(recentNews);
  }

  return results;
}
