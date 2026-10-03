<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep shared kiosk navigation in the root shell and each section as its own TanStack route so direct links and page metadata stay independent.
- Keep KIOSK's palette and touch sizing in semantic CSS tokens and Button variants so navigation stays consistent across kiosk and mobile layouts.
