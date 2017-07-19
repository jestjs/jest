# Migrating Jest to Docusaurus

## Steps:

1. Navigate to `website` folder

2. Rewrite `package.json`. Delete all scripts except crowdin scripts. Delete all dev-dependencies except crowdin-cli. Add all docusaurus scripts:
    ```
    {
      "scripts": {
        "start": "docusaurus-start",
        "build": "docusaurus-build",
        "publish-gh-pages": "docusaurus-publish",
        "examples": "docusaurus-examples",
        "write-translations": "docusaurus-write-translations"
      }
    }
    ```

3. Install Docusaurus using `npm install --save-dev docusaurus`.

4. Delete `server` folder.

5. Run `npm run examples` to generate example files.

6. Delete unnecessary example files: `docs-examples-from-docusaurus` and `blog-examples-from-docusaurus` in the `jest` folder, and all files inside the `static` folder.

7. Move the folder `src/jest/img` to `static/img`.

8. Change example files in `pages` to fit Jest:

    For `help.js`:
      - Use `core/JestHelp.js` as a reference.
      - Remove the `<Site> </Site>` tags in the return statement of the `render` method.
      - Replace all references to strings with the string literals (from `i18n/en.json`) inside a `<translate>` tag.
      - Add the following `require` statement to the top of `help.js`: `const translate = require("../../server/translate.js").translate;`

    For `index.js`:

      Start with the `HomeSplash` class:
      - Replace the `render` method of the `HomeSplash` component inside `index.js` with the `render` method of `core/home/HomeSplash.js`.
      - Copy the `const githubButton` statement from the current `siteConfig.js` into the top of `index.js`. Replace the reference `siteConfig.githubButton` with `githubButton`.
      - Replace `siteConfig[this.props.language].tagline` with `translation[this.props.language]["localized-strings"].tagline`.
      - Replace occurences of `"/jest/"` with `{siteConfig.baseUrl}`.
      - Replace references to strings with the string literals inside a  `<translate>` tag.

      Then change the `Index` class:
      - Replace the `return` statement of the `render` method in `index.js` with the `return` statement of the `render` method in `core/JestIndex.js`.
      - Replace `<Site language={this.props.language}` with `<div>` and the closing `</Site>` with `</div>`.
      - Delete the `mostRecentPost` prop in the `HomeSplash` component.
      - Replace all string references with string literals inside `<translate>` tags.
      - Change `href` of `more-users` button at the bottom from `"/jest/users.html"` to `{siteConfig.baseUrl + this.props.language + "/users.html"}`
      - Add the two `require` statements to the top:
        ```
        const translate = require("../../server/translate.js").translate;
        const translation = require("../../server/translation.js");
        ```

    For `users.js`:
      - Replace all string references with string literals inside `<translate>` tags. Add the `require` statement to the top: `const translate = require("../../server/translate.js").translate;`

9. Delete everything in `core` except `Footer.js`.

10. Delete the `src` folder.

11. Delete `publish-gh-pages.js`.

12. Update `siteConfig.js`:
- Add a `tagline` field after `title`: 
  ```
  tagline: "🃏 Delightful JavaScript Testing",
  ```
- Add a `projectName` field after `baseUrl`: 
  ```
  projectName: "jest",
  ```
- Delete the `githubButton` reference.
- Add an `editUrl` field after `users`: 
  ```
  editUrl: "https://github.com/facebook/jest/edit/master/docs/",
  ```
- Add a `headerLinksInternal` field for all internal links in the header after `editUrl`: 
  ```
  headerLinksInternal: [
    {
      section: "docs",
      href: "/jest/docs/LANGUAGE/getting-started.html",
      text: "Docs"
    },
    { section: "api", href: "/jest/docs/LANGUAGE/api.html", text: "API" },
    { section: "help", href: "/jest/LANGUAGE/help.html", text: "Help" },
    { section: "blog", href: "/jest/blog/", text: "Blog" }
  ],"
  ```
- Add a `headerLinksExternal` field for all external links in the header after that:
  ```
  headerLinksExternal: [
    {
      section: "github",
      href: "https://github.com/facebook/jest",
      text: "GitHub"
    }
  ],
  ```
- Add `headerIcon`, `footerIcon`, and `favicon` fields after that:
  ```
  headerIcon: "img/jest-outline.svg",
  footerIcon: "img/jest-outline.svg",
  favicon: "img/favicon/favicon.ico",
  ```
- Add a `docsSidebarDefaults` field:
  ```
  docsSidebarDefaults: {
    layout: "docs",
    root: "/jest/docs/en/getting-started.html",
    title: "Docs"
  },
  ```
- Add a `recruitingLink` field: 
  ```
  recruitingLink: "https://crowdin.com/project/jest",
  ```
- Add Jest's `algolia` field:
  ```
  algolia: {
    apiKey: "833906d7486e4059359fa58823c4ef56",
    indexName: "jest"
  },
  ```
- Add Jest's `gaTrackingId` for Google Analytics: 
  ```
  gaTrackingId: "UA-44373548-17",
  ```
- Add `colors`:
  ```
  colors: {
    primaryColor: "#99424f",
    secondaryColor: "#7f2c39",
    prismColor: "rgba(153, 66, 79, 0.03)"
  }
  ```

13. Update Jest's `circle.yml` file:
    ```yaml
    deployment:
      website:
        branch: master
        owner: facebook
        commands:
          # configure git user
          - git config --global user.email "jest-bot@users.noreply.github.com"
          - git config --global user.name "Website Deployment Script"
          - echo "machine github.com login jest-bot password $GITHUB_TOKEN" > ~/.netrc
          # install Docusaurus and generate file of English strings
          - cd website && npm install && npm run write-translations && cd ..
          # crowdin install
          - sudo apt-get install default-jre
          - wget https://artifacts.crowdin.com/repo/deb/crowdin.deb -O crowdin.deb
          - sudo dpkg -i crowdin.deb
          # translations upload/download
          - crowdin --config crowdin.yaml upload sources --auto-update -b master
          - crowdin --config crowdin.yaml download -b master
          # build and publish website
          - cd website && GIT_USER=jest-bot npm run publish-gh-pages
    ```

***

After migration `README.md`:

You will need Node 6 or newer to build the Jest website.

# Run the server

The first time, get all the dependencies loaded via

```
npm install
```

Then, run the server via

```
npm start
Open http://localhost:3000/jest/index.html
```

You can also specify the port number

```
npm start -- --port 8080
Open http://localhost:8080/jest/index.html
```

Anytime you change the contents, just refresh the page and it's going to be updated

# Publish the website

The Jest website is hosted as a GitHub page. A static site is generated by running

```
npm run build
```

CircleCI is configured to generate the static site and pushed to the `gh-pages` branch whenever `master` is updated.

To deploy the website manually, run the following command as a Git user with write permissions:

```
DEPLOY_USER=facebook GIT_USER=jest-bot CIRCLE_PROJECT_USERNAME=facebook CIRCLE_PROJECT_REPONAME=jest CIRCLE_BRANCH=master npm run publish-gh-pages
```

## Staging

Run the above command against your own fork of `facebook/jest`:

```
DEPLOY_USER=YOUR_GITHUB_USERNAME GIT_USER=YOUR_GITHUB_USERNAME CIRCLE_PROJECT_USERNAME=YOUR_GITHUB_USERNAME CIRCLE_PROJECT_REPONAME=jest CIRCLE_BRANCH=master npm run publish-gh-pages
```
