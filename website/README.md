# Run the server

The first time, get all the dependencies loaded via

```
npm install
```

Then, run the server via

```
npm start
```

Anytime you change the file, just refresh the website and it's going to work

# Publish the website

First setup your environment by having two folders, one `jest` and one `jest-gh-pages`. The publish script expect those exact names.

```
cd ../../
git clone git@github.com:facebook/jest.git jest-gh-pages
cd jest-gh-pages
git checkout origin/gh-pages
git checkout -b gh-pages
git push --set-upstream origin gh-pages
```

Then, after you've done changes, just run the command and it'll automatically build the static version of the site and publish it to gh-pages.

```
./publish.sh
```
