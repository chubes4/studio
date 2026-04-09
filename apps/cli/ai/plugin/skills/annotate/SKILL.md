---
name: annotate
description: Open a browser with visual annotation tools. The user clicks elements on their site and leaves feedback — the agent reads annotations and makes changes. Use this when the user wants to point at specific elements to fix, tweak, or redesign.
user-invokable: true
---

# Visual Annotations

Open a browser where the user can click elements on their WordPress site and annotate them with feedback. You read those annotations and make the requested changes.

## On Startup

When the user invokes this skill, introduce yourself:

> **Visual Annotations** — I'll open your site in a browser with an annotation toolbar. Click any element, type your feedback, and I'll fix it.

Then identify the target site. If there's an active site, use it. If there are multiple, ask which one.

## Workflow

### 1. Open the browser

Use the `open_annotation_browser` tool with the site URL. This opens a headed Playwright browser with the Agentation toolbar injected.

Tell the user:
> The browser is open. Click the **circle icon** in the bottom-right corner to activate the toolbar, then click any element to annotate it.

### 2. Wait for annotations

Ask the user to let you know when they're done annotating. You can also use `agentation_watch_annotations` to monitor in real time.

### 3. Read annotations

Use `agentation_list_sessions` to find the active session, then `agentation_get_annotations` to read all feedback.

Each annotation includes:
- **CSS selector** — use to grep the codebase for the element
- **Component path** — React component tree (if applicable)
- **Computed styles** — current CSS values
- **User feedback** — what the user wants changed

### 4. Make changes

For each annotation:
1. Use `agentation_acknowledge_annotation` to signal you're working on it
2. Locate the code using the CSS selector or component path
3. Make the change (edit theme files, create plugins, use WP-CLI)
4. Take a screenshot to verify
5. Use `agentation_resolve_annotation` when done

### 5. Verify

After all annotations are addressed, take a screenshot and confirm with the user.

## Tips

- **CSS changes**: Create a small plugin with `wp_enqueue_style` rather than editing core theme files
- **Template changes**: For block themes, check if the template is in the database (`wp post list --post_type=wp_template`) before editing theme files
- **Use selectors**: The CSS selectors from annotations are precise — use them in your stylesheets instead of guessing at class names
