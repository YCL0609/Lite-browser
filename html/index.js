// GetBookmarks();

async function GetBookmarks() {
    const bookmarkList = await window.litebrowser.getBookmarks();
    alert(bookmarkList)
}