import uniqBy from 'lodash/uniqBy';
import flatMap from 'lodash/flatMap';

import { getFilteredSuggestions } from 'lib/utils.js';
import tabSuggestions, {
  allTabSuggestions,
  recentVisitedTabSuggestions
} from './tab.js';
import {
  getAllSuggestions as getAllClosedTabs,
  recentlyClosedTabSuggestions
} from './closedTab.js';
import { allHistorySuggestions as getAllHistoryTabs } from './history.js';
import { allBookmarkSuggestions as getBookmarkTabs } from './bookmark.js';

function filterUniqueTabs(tabs) {
  return uniqBy(tabs, ['url', 'title']);
}

function compareRecentlyViewedSuggestions(suggestion1, suggestion2) {
  return suggestion2.lastAccessed - suggestion1.lastAccessed;
}

async function allRecentlyViewedSuggestions(searchString) {
  const tasks = [
    getAllHistoryTabs(searchString),
    getBookmarkTabs(searchString)
  ];

  if (SAKA_PLATFORM === 'chrome') {
    tasks.push(recentVisitedTabSuggestions(searchString));
    tasks.push(recentlyClosedTabSuggestions(searchString));
  } else {
    tasks.push(tabSuggestions(searchString));
    tasks.push(getAllClosedTabs(searchString));
  }

  const [historyTabs, bookmarkTabs, openTabs, closedTabs] = await Promise.all(
    tasks
  );

  return filterUniqueTabs([
    ...openTabs,
    ...closedTabs,
    ...bookmarkTabs,
    ...historyTabs
  ])
    .map(tab => ({ ...tab, originalType: tab.type, type: 'recentlyViewed' }))
    .sort(compareRecentlyViewedSuggestions);
}

async function filteredRecentlyViewedSuggestions(searchString) {
  const results = await Promise.all([
    allTabSuggestions(),
    getAllClosedTabs(searchString),
    getBookmarkTabs(searchString),
    getAllHistoryTabs(searchString)
  ]);

  const r = flatMap(results, tabs => tabs).map(tab => ({
    ...tab,
    originalType: tab.type,
    type: 'recentlyViewed'
  }));

  return r;
}

async function getFilteredRecentlyViewedSuggestions(searchString) {
  const filteredSuggestions = await getFilteredSuggestions(searchString, {
    getSuggestions: filteredRecentlyViewedSuggestions,
    threshold: 0.5,
    keys: ['title', 'url']
  });

  return filteredSuggestions;
}

export default async function recentlyViewedSuggestions(searchString) {
  if (searchString === '') {
    // return allRecentlyViewedSuggestions(searchString, SAKA_PLATFORM);
    return [];
  }

  return getFilteredRecentlyViewedSuggestions(searchString);
}
