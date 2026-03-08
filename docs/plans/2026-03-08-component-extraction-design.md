# Component Extraction Design

## Goal

Extract repeated UI patterns into shared components to reduce duplication across the klay+ web frontend.

## Phase 1 — High Impact

### 1. `<OverlayPanel>` (11 instances, ~400 lines saved)

Wraps `<Overlay>` with standard header (icon + title + X button) and scrollable body.

```tsx
interface OverlayPanelProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  icon: IconName;
  iconColor?: string;        // default: "text-accent"
  title: string;
  children: React.ReactNode;
  width?: string;             // default: "w-[420px]"
}
```

Consumers replace ~35 lines of boilerplate with:
```tsx
<OverlayPanel open={show} setOpen={setShow} icon="layers" title="Generate Projection">
  {body}
</OverlayPanel>
```

### 2. `<FileDropZone>` + utilities (3 instances, ~250 lines saved)

**Shared utilities** → `utils/fileDetection.ts`:
- `SUPPORTED_EXTENSIONS`, `ACCEPT_STRING`, `MAX_FILE_SIZE`
- `detectFileType()`, `getFileExtension()`, `formatFileSize()`, `validateFile()`

**Component** → `shared/FileDropZone.tsx`:
```tsx
interface FileDropZoneProps {
  file: File | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
  error?: string | null;
  disabled?: boolean;
  height?: number;            // default: 200
}
```

Handles all DnD (page-level + zone-level), file input, validation, preview rendering.

### 3. Strategy constants → `constants/processingStrategies.ts`

Move `CHUNKING_STRATEGIES` and `EMBEDDING_STRATEGIES` arrays from CreateProfileForm and ProfileEditForm into shared constants file.

## Phase 2 — Medium Impact

### 4. `<LoadingButton>` (10 instances, ~80 lines saved)

Extends `<Button>` with loading state:
```tsx
interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}
```

### 5. `<Textarea>` (shared component)

Follows same pattern as `<Input>` and `<Select>`:
```tsx
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
```

### 6. Form field consistency

Replace manual label+input/select patterns in CreateContextForm, GenerateProjectionAction, and DeprecateContextAction with shared `<Input>`, `<Select>`, `<Textarea>` components.

## Files to Create

- `apps/web/src/components/shared/OverlayPanel.tsx`
- `apps/web/src/components/shared/FileDropZone.tsx`
- `apps/web/src/components/shared/Textarea.tsx`
- `apps/web/src/components/shared/LoadingButton.tsx`
- `apps/web/src/utils/fileDetection.ts`
- `apps/web/src/constants/processingStrategies.ts`

## Files to Refactor

- All 7 action components (GenerateProjection, Reprocess, Rollback, RemoveSource, Archive, Deprecate + ProfileList deprecate overlay)
- ProfilesPage.tsx (create + edit overlays)
- ContextsIndexPage.tsx (create overlay)
- CreateProfileForm.tsx + ProfileEditForm.tsx (strategy constants)
- DocumentUploadForm.tsx + AddSourceUploadForm.tsx + CreateContextForm.tsx (FileDropZone)
- CreateContextForm.tsx + DeprecateContextAction.tsx + GenerateProjectionAction.tsx (form consistency)
