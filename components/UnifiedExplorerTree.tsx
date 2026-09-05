'use client';

import UnifiedExplorerTreeFolder, { 
  UnifiedCollectionNode, 
  UnifiedExplorerTreeFolderProps 
} from '@/components/UnifiedExplorerTreeFolder';

export type { UnifiedCollectionNode };

export default function UnifiedExplorerTree(props: UnifiedExplorerTreeFolderProps) {
  return <UnifiedExplorerTreeFolder {...props} />;
}