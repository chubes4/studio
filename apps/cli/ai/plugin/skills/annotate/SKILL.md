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

Use `agentation_get_all_pending` to get unresolved annotations. Ignore old/resolved sessions — only act on pending annotations for the current site URL.

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

## Making changes the WordPress way

Always prefer WordPress APIs over direct file edits or custom plugins.

### CSS / design changes

Use **Global Styles custom CSS** — never create throwaway plugins:
```
wp option get stylesheet   → get active theme slug
wp post list --post_type=wp_global_styles --post_status=publish --format=json   → find global styles post
```
Then edit the global styles post's `content` to add custom CSS, or update `settings`/`styles` JSON for design tokens (colors, fonts, spacing).

Alternatively, use WP-CLI:
```
wp eval 'echo wp_get_custom_css();'   → read current custom CSS
wp eval 'wp_update_custom_css_post("CSS HERE");'   → update custom CSS
```

### Template changes

Create **template overrides via the database**, not file edits:
```
wp post create --post_type=wp_template --post_name="theme-slug//template-name" --post_content="BLOCK MARKUP" --post_status=publish
```
Check existing overrides first: `wp post list --post_type=wp_template --format=json`

### Block content changes

Edit **post/page content directly** via WP-CLI:
```
wp post update <id> --post_content="UPDATED BLOCK MARKUP"
```
Always validate blocks after editing content.

### What NOT to do

- Do NOT create custom plugins for simple CSS changes
- Do NOT edit theme source files — use database overrides
- Do NOT hardcode colors — use theme.json tokens or Global Styles
- Do NOT modify core WordPress files
