const {html} = require('../utils');
const {$getRoot} = require('lexical');
const {createHeadlessEditor} = require('@lexical/headless');
const {$generateNodesFromDOM} = require('@lexical/html');
const {JSDOM} = require('jsdom');
const Prettier = require('prettier');

const {BookmarkNode, $createBookmarkNode, $isBookmarkNode} = require('../../');

const editorNodes = [BookmarkNode];

describe('BookmarkNode', function () {
    let editor;
    let dataset;
    let exportOptions;

    // NOTE: all tests should use this function, without it you need manual
    // try/catch and done handling to avoid assertion failures not triggering
    // failed tests
    const editorTest = testFn => function (done) {
        editor.update(() => {
            try {
                testFn();
                done();
            } catch (e) {
                done(e);
            }
        });
    };

    beforeEach(function () {
        editor = createHeadlessEditor({nodes: editorNodes});

        dataset = {
            url: 'https://www.ghost.org/',
            icon: 'https://www.ghost.org/favicon.ico',
            title: 'Ghost: The Creator Economy Platform',
            description: 'doing kewl stuff',
            author: 'ghost',
            publisher: 'Ghost - The Professional Publishing Platform',
            thumbnail: 'https://ghost.org/images/meta/ghost.png',
            caption: 'caption here'
        };

        exportOptions = {
            createDocument() {
                return (new JSDOM()).window.document; 
            }
        };
    });

    it('matches node with $isBookmarkNode', editorTest(function () {
        const bookmarkNode = $createBookmarkNode(dataset);
        $isBookmarkNode(bookmarkNode).should.be.true;
    }));

    describe('data access', function () {
        it('has getters for all properties', editorTest(function () {
            const bookmarkNode = $createBookmarkNode(dataset);

            bookmarkNode.getUrl().should.equal(dataset.url);
            bookmarkNode.getIcon().should.equal(dataset.icon);
            bookmarkNode.getTitle().should.equal(dataset.title);
            bookmarkNode.getDescription().should.equal(dataset.description);
            bookmarkNode.getAuthor().should.equal(dataset.author);
            bookmarkNode.getPublisher().should.equal(dataset.publisher);
            bookmarkNode.getThumbnail().should.equal(dataset.thumbnail);
            bookmarkNode.getCaption().should.equal(dataset.caption);
        }));

        it('has setters for all properties', editorTest(function () {
            const bookmarkNode = $createBookmarkNode();

            bookmarkNode.getUrl().should.equal('');
            bookmarkNode.setUrl('https://www.ghost.org/');
            bookmarkNode.getUrl().should.equal('https://www.ghost.org/');

            bookmarkNode.getIcon().should.equal('');
            bookmarkNode.setIcon('https://www.ghost.org/favicon.ico');
            bookmarkNode.getIcon().should.equal('https://www.ghost.org/favicon.ico');

            bookmarkNode.getTitle().should.equal('');
            bookmarkNode.setTitle('Ghost: The Creator Economy Platform');
            bookmarkNode.getTitle().should.equal('Ghost: The Creator Economy Platform');

            bookmarkNode.getDescription().should.equal('');
            bookmarkNode.setDescription('doing kewl stuff');
            bookmarkNode.getDescription().should.equal('doing kewl stuff');

            bookmarkNode.getAuthor().should.equal('');
            bookmarkNode.setAuthor('ghost');
            bookmarkNode.getAuthor().should.equal('ghost');

            bookmarkNode.getPublisher().should.equal('');
            bookmarkNode.setPublisher('Ghost - The Professional Publishing Platform');
            bookmarkNode.getPublisher().should.equal('Ghost - The Professional Publishing Platform');

            bookmarkNode.getThumbnail().should.equal('');
            bookmarkNode.setThumbnail('https://ghost.org/images/meta/ghost.png');
            bookmarkNode.getThumbnail().should.equal('https://ghost.org/images/meta/ghost.png');

            bookmarkNode.getCaption().should.equal('');
            bookmarkNode.setCaption('caption here');
            bookmarkNode.getCaption().should.equal('caption here');
        }));

        it('has getDataset() convenience method', editorTest(function () {
            const bookmarkNode = $createBookmarkNode(dataset);
            const bookmarkNodeDataset = bookmarkNode.getDataset();

            bookmarkNodeDataset.should.deepEqual({
                ...dataset
            });
        }));

        it('has isEmpty() convenience method', editorTest(function () {
            const bookmarkNode = $createBookmarkNode(dataset);

            bookmarkNode.isEmpty().should.be.false;
            bookmarkNode.setUrl('');
            bookmarkNode.isEmpty().should.be.true;
        }));
    });

    describe('exportDOM', function () {
        it('creates an bookmark card', editorTest(function () {
            const bookmarkNode = $createBookmarkNode(dataset);
            const {element} = bookmarkNode.exportDOM(exportOptions);

            const expectedHtml = `
                <figure class="kg-card kg-bookmark-card kg-card-hascaption">
                    <a class="kg-bookmark-container" href="${dataset.url}">
                        <div class="kg-bookmark-content">
                            <div class="kg-bookmark-title">${dataset.title}</div>
                            <div class="kg-bookmark-description">${dataset.description}</div>
                            <div class="kg-bookmark-metadata">
                                <img class="kg-bookmark-icon" src="${dataset.icon}" alt="">
                                <span class="kg-bookmark-author">${dataset.author}</span>
                                <span class="kg-bookmark-publisher">${dataset.publisher}</span>
                            </div>
                        </div>
                        <div class="kg-bookmark-thumbnail">
                            <img src="${dataset.thumbnail}" alt="">
                        </div>
                    </a>
                    <figcaption>${dataset.caption}</figcaption>
                </figure>
            `;

            const prettyExpectedHtml = Prettier.format(expectedHtml, {parser: 'html'});

            element.outerHTML.should.prettifyTo(prettyExpectedHtml);
        })); 

        it('renders email target', editorTest(function () {
            const options = {
                target: 'email'
            };
            const bookmarkNode = $createBookmarkNode(dataset);
            const {element} = bookmarkNode.exportDOM({...exportOptions, ...options});
            
            element.should.not.containEql('<figure');
            element.should.containEql('<!--[if vml]>');
            element.should.containEql('<table class="kg-card kg-bookmark-card--outlook"');
        }));

        it('renders nothing with a missing src', editorTest(function () {
            const bookmarkNode = $createBookmarkNode();
            const {element} = bookmarkNode.exportDOM(exportOptions);

            element.textContent.should.equal('');
            should(element.outerHTML).be.undefined();
        }));
    });

    describe('exportJSON', function () {
        it('contains all data', editorTest(function () {
            const bookmarkNode = $createBookmarkNode(dataset);
            const json = bookmarkNode.exportJSON();

            json.should.deepEqual({
                type: 'bookmark',
                version: 1,
                url: dataset.url,
                icon: dataset.icon,
                title: dataset.title,
                description: dataset.description,
                author: dataset.author,
                publisher: dataset.publisher,
                thumbnail: dataset.thumbnail,
                caption: dataset.caption
            });
        }));
    });

    describe('importJSON', function () {
        it('imports all data', function (done) {
            const serializedState = JSON.stringify({
                root: {
                    children: [{
                        type: 'bookmark',
                        ...dataset
                    }],
                    direction: null,
                    format: '',
                    indent: 0,
                    type: 'root',
                    version: 1
                }
            });

            const editorState = editor.parseEditorState(serializedState);
            editor.setEditorState(editorState);

            editor.getEditorState().read(() => {
                try {
                    const [bookmarkNode] = $getRoot().getChildren();

                    bookmarkNode.getUrl().should.equal(dataset.url);
                    bookmarkNode.getIcon().should.equal(dataset.icon);
                    bookmarkNode.getTitle().should.equal(dataset.title);
                    bookmarkNode.getDescription().should.equal(dataset.description);
                    bookmarkNode.getAuthor().should.equal(dataset.author);
                    bookmarkNode.getPublisher().should.equal(dataset.publisher);
                    bookmarkNode.getThumbnail().should.equal(dataset.thumbnail);
                    bookmarkNode.getCaption().should.equal(dataset.caption);

                    done();
                } catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('hasEditMode', function () {
        it('returns true', editorTest(function () {
            const bookmarkNode = $createBookmarkNode(dataset);
            bookmarkNode.hasEditMode().should.be.true;
        }));
    });

    describe('clone', function () {
        it('clones the node', editorTest(function () {
            const bookmarkNode = $createBookmarkNode(dataset);
            const clonedBookmarkNode = BookmarkNode.clone(bookmarkNode);
            $isBookmarkNode(clonedBookmarkNode).should.be.true;
            clonedBookmarkNode.getUrl().should.equal(dataset.url);
        }));
    });

    describe('static properties', function () {
        it('getType', editorTest(function () {
            BookmarkNode.getType().should.equal('bookmark');
        }));

        it('urlTransformMap', editorTest(function () {
            BookmarkNode.urlTransformMap.should.deepEqual({
                url: 'url',
                icon: 'url',
                thumbnail: 'url'
            });
        }));
    });

    describe('importDOM', function () {
        it('parses bookmark card', editorTest(function () {
            const dom = (new JSDOM(html`
                <figure class="kg-card kg-bookmark-card kg-card-hascaption">
                    <a class="kg-bookmark-container" href="${dataset.url}">
                        <div class="kg-bookmark-content">
                            <div class="kg-bookmark-title">${dataset.title}</div>
                            <div class="kg-bookmark-description">${dataset.description}</div>
                            <div class="kg-bookmark-metadata">
                                <img class="kg-bookmark-icon" src="${dataset.icon}" alt="">
                                <span class="kg-bookmark-author">${dataset.author}</span>
                                <span class="kg-bookmark-publisher">${dataset.publisher}</span>
                            </div>
                        </div>
                        <div class="kg-bookmark-thumbnail">
                            <img src="${dataset.thumbnail}" alt="">
                        </div>
                    </a>
                    <figcaption>${dataset.caption}</figcaption>
                </figure>
            `)).window.document;
            const nodes = $generateNodesFromDOM(editor, dom);

            nodes.length.should.equal(1);
            nodes[0].getUrl().should.equal(dataset.url);
            nodes[0].getIcon().should.equal(dataset.icon);
            nodes[0].getTitle().should.equal(dataset.title);
            nodes[0].getDescription().should.equal(dataset.description);
            nodes[0].getAuthor().should.equal(dataset.author);
            nodes[0].getPublisher().should.equal(dataset.publisher);
            nodes[0].getThumbnail().should.equal(dataset.thumbnail);
            nodes[0].getCaption().should.equal(dataset.caption);
        }));
    });
});
