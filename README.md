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
