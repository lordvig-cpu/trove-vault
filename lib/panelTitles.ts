import { DockContent } from '@/hooks/usePanelDockDrag';

/** The header title for a panel's docked tab(s): the sole tab's, else the active tab's. */
export function getPanelTitle(tabs: DockContent[], activeTab: DockContent, defaultTitle: string): string {
  if (tabs.length === 0) return defaultTitle;
  if (tabs.length === 1) {
    if (tabs[0] === 'items') return 'ITEMS';
    if (tabs[0] === 'collections') return 'COLLECTIONS';
    if (tabs[0] === 'templates') return 'TEMPLATES';
    if (tabs[0] === 'template_editor') return 'CONTENT';
    if (tabs[0] === 'template_properties') return 'PROPERTIES';
    if (tabs[0] === 'template_builder') return 'COMPONENTS';
    if (tabs[0] === 'template_hierarchy') return 'LAYOUT';
    if (tabs[0] === 'grabbed_content') return 'GRABBED CONTENT';
  }
  if (activeTab === 'items') return 'ITEMS';
  if (activeTab === 'collections') return 'COLLECTIONS';
  if (activeTab === 'templates') return 'TEMPLATES';
  if (activeTab === 'template_editor') return 'CONTENT';
  if (activeTab === 'template_properties') return 'PROPERTIES';
  if (activeTab === 'template_builder') return 'COMPONENTS';
  if (activeTab === 'template_hierarchy') return 'LAYOUT';
  if (activeTab === 'grabbed_content') return 'GRABBED CONTENT';
  return defaultTitle;
}
