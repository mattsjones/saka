import * as providers from './providers/index.js';

export async function getSuggestions([mode, searchString]) {
  return providers[mode](searchString);
}

async function focusOrCreateTab(url) {
  const [existingTab] = await browser.tabs.query({ url });

  if (existingTab) {
    await browser.tabs.update(existingTab.id, { active: true });
    await browser.windows.update(existingTab.windowId, { focused: true });
    return;
  }

  await browser.tabs.create({ url });
}

export async function activateSuggestion(suggestion) {
  switch (suggestion.type) {
    case 'tab':
      await browser.tabs.update(suggestion.tabId, { active: true });
      await browser.windows.update(suggestion.windowId, { focused: true });
      break;
    case 'closedTab':
      await browser.sessions.restore(suggestion.sessionId);
      break;
    case 'bookmark':
      await focusOrCreateTab(suggestion.url);
      break;
    case 'history':
      await focusOrCreateTab(suggestion.url);
      break;
    case 'recentlyViewed':
      await activateSuggestion({
        ...suggestion,
        type: suggestion.originalType
      });
      break;
    default:
      console.error(
        `activation not yet implemented for suggestions of type ${
        suggestion.type
        }`
      );
  }
}

export async function closeTab(suggestion) {
  await browser.tabs.remove(suggestion.tabId);
}
