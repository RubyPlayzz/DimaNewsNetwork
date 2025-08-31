// ====== Generate table of contents ====== //
const headerRange = 75;
const article = document.querySelector("article")
const tableOfContentsContainer = document.getElementById("table-of-contents-items");
let articleHeadings = [];
let tocItems = [];
const headingTags = [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6"
]

const children = article.children
for (let i = 0; i < children.length; i++) {
    let childNode = children[i];

    if (headingTags.includes(childNode.tagName.toLowerCase()) && childNode.id != "article-title" && !childNode.classList.contains("toc-hidden")) {
        articleHeadings.push(childNode);
    };
};

function scrollHeadingIntoView(heading) {   
    heading.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    history.pushState(null, "", `#${heading.id}`); // Changes the URL
}

articleHeadings.map((heading) => {
    let headingId = heading.innerText;

    headingId = headingId.toLowerCase();
    headingId = headingId.replace(" ", "-");

    heading.id = headingId;

    const tableOfContentsItem = document.createElement("a");

    tableOfContentsItem.href = `#${heading.id}`;
    tableOfContentsItem.innerText = heading.innerText;

    tableOfContentsContainer.appendChild(tableOfContentsItem);
    tocItems.push(tableOfContentsItem)

    tableOfContentsItem.addEventListener("click", (event) => {
        event.preventDefault();

        scrollHeadingIntoView(heading, tableOfContentsItem);
    })

    heading.addEventListener("click", (event) => {
        event.preventDefault();

        scrollHeadingIntoView(heading);
    });
});

window.addEventListener("scroll", () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    tocItems.forEach(item =>
        item.classList.remove('activeTableOfContentItem')
    );

    for (let i = articleHeadings.length - 1; i >= 0; i--) {
        const heading = articleHeadings[i];
        // getBoundingClientRect().top is relative to viewport,
        // so add pageYOffset to get the distance from the top of the document
        const headingTop = heading.getBoundingClientRect().top + scrollTop;

        if (scrollTop > headingTop - headerRange) {
        tocItems[i].classList.add('activeTableOfContentItem');
        break;
        }
    }
});