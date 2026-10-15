# Portfolio

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.6.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Deploy To GitHub Pages

This project is prepared for GitHub Pages deployment.

Last updated for GitHub Pages deployment trigger.

### Automatic deployment (recommended)

1. Push this project to a GitHub repository.
2. Keep the default branch as `main` (or update `.github/workflows/deploy-pages.yml` if different).
3. In GitHub, open **Settings > Pages** and set **Source** to **GitHub Actions**.
4. Push to `main` and the workflow in `.github/workflows/deploy-pages.yml` will build and deploy automatically.

The workflow automatically sets the Angular `base-href` to `/${repo-name}/`, which is required for project pages.

### Manual deployment scripts

- Build for project pages:

```bash
npm run build:pages
```

- Build for user/org root page (if the repo is `<user>.github.io`):

```bash
npm run build:pages:root
```

- Preview the built output locally:

```bash
npm run preview:dist
```

- Publish manually with `gh-pages` (after building):

```bash
npm run deploy:manual
```

## Portfolio workspace

The project list in `src/app/app.ts` is the source of truth for the wheel, project pane, terminal transcript, repository links, and active-project status. Project paths under `~/Projects/` are virtual portfolio paths; they are not claims about files present on the visitor's machine.

The command input supports:

- `whoami` and `fetch shokomori` for the portfolio identity and curated project count.
- `ls` and `ls links/` for the project and public GitHub link listings.
- `pwd` for the selected portfolio project's virtual path.
- `:e ~/Projects/<project-id>` to select a project and refresh its details.
- `:Git` to display the selected project's GitHub repository URL.
- `:theme <name>` to select one of the portfolio's available themes.

The colon shortcut focuses the command input and seeds the `:` prefix. Unsupported commands and invalid project paths return explicit errors. Portfolio output intentionally avoids GitHub activity figures or biography claims that are not supported by the project's data.

## CV and credentials

The `cv` control opens a portfolio pop-out with `whoami`, `certifications`, and an embedded CV PDF slide. The PDF can also be opened in its own browser tab. Certificate image files are maintained in `certificates/` and copied into the site output by the Angular asset configuration.

## Reference verification scope

The live reference was observed rendering a project-and-section wheel, its `whoami`, `fetch`, and `ls links/` entries, and navigation with `:e` to a section path. The prompt styling, project navigation hints, and status indicators were also visible. Its owner-specific text, statistics, theme command outcomes, command history, invalid-command responses, and screenshot-opening states were not exhaustively verified and are not represented as Masato's information. The portfolio uses its own verified project data with the observed workspace interaction conventions.
