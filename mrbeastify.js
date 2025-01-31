const imagesPath = "images/";
var useAlternativeImages
var flipBlacklist // Stores flipBlackList.js
var blacklistStatus
var highestImageIndex = 148; // Highest image index

// Apply the overlay
function applyOverlay(thumbnailElement, overlayImageURL, flip = false) {
    // Create a new img element for the overlay
    const overlayImage = document.createElement("img");
    overlayImage.src = overlayImageURL;
    overlayImage.style.position = "absolute";
    overlayImage.style.top = overlayImage.style.left = "50%";
    overlayImage.style.width = "100%";
    overlayImage.style.transform = `translate(-50%, -50%) ${flip ? 'scaleX(-1)' : ''}`; // Center and flip the image
    overlayImage.style.zIndex = "0"; // Ensure overlay is on top but below the time indicator
    thumbnailElement.parentElement.insertBefore(overlayImage, thumbnailElement.nextSibling /*Makes sure the image doesn't cover any info, but still overlays the original thumbnail*/ );
};

function FindThumbnails() {
    var thumbnailImages = document.querySelectorAll("ytd-thumbnail:not(.ytd-video-preview, .ytd-rich-grid-slim-media) a > yt-image > img.yt-core-image:only-child:not(.yt-core-attributed-string__image-element)");
    var notificationImages = document.querySelectorAll('img.style-scope.yt-img-shadow[width="86"]');

    const allImages = [ // Put all the selected images into an array
        ...Array.from(thumbnailImages),
        ...Array.from(notificationImages),
    ];

    // Check whether the aspect ratio matches that of a thumbnail
    const targetAspectRatio = [16 / 9, 4 / 3];
    const errorMargin = 0.02; // Allows for 4:3, since YouTube is badly coded

    var listAllThumbnails = allImages.filter(image => {
        // Check if the height is not 0 before calculating the aspect ratio
        if (image.height === 0) {
            return false;
        }

        const aspectRatio = image.width / image.height;
        let isCorrectAspectRatio = (Math.abs(aspectRatio - targetAspectRatio[0]) < errorMargin) || (Math.abs(aspectRatio - targetAspectRatio[1]) < errorMargin);
        return isCorrectAspectRatio;
    });

    // Select all images from the recommended video screen
    var videowallImages = document.querySelectorAll(".ytp-videowall-still-image:not([style*='extension:'])"); // Because youtube video wall images are not properly classified as images

    listAllThumbnails = listAllThumbnails.concat(Array.from(videowallImages));

    return listAllThumbnails.filter(image => {
        const parent = image.parentElement;

        // Checks whether it's a video preview
        const isVideoPreview = parent.closest("#video-preview") !== null || parent.tagName == "YTD-MOVING-THUMBNAIL-RENDERER"

        // Checks whether it's a chapter thumbnail
        const isChapter = parent.closest("#endpoint") !== null

        // Checks if thy thumbnail has loaded
        const isLoaded = image.complete && image.naturalHeight !== 0;

        // Check if thumbnails have already been processed
        const processed = Array.from(parent.children).filter(child => {
            return (
                child.src &&
                child.src.includes("extension") ||
                isVideoPreview || isChapter || !isLoaded);
        });

        return processed.length == 0;
    });
}

// Looks for all thumbnails and applies overlay
function applyOverlayToThumbnails() {
    thumbnailElements = FindThumbnails()

    // Apply overlay to each thumbnail
    thumbnailElements.forEach((thumbnailElement) => {
        // Get overlay image URL from your directory
        const overlayImageIndex = getRandomImageFromDirectory();
        let flip = Math.random() < 0.25; // 25% chance to flip the image
        let overlayImageURL
        if (flip && flipBlacklist && flipBlacklist.includes(overlayImageIndex)) { // Check if the image is on the blacklist
            if (useAlternativeImages) { // Check if useAlternativeImages is true
                overlayImageURL = getImageURL(`textFlipped/${overlayImageIndex}`);
            } else {
                overlayImageURL = getImageURL(overlayImageIndex);
            }
            flip = false;
        } else { // Don't flip the image
            overlayImageURL = getImageURL(overlayImageIndex);
        }
        applyOverlay(thumbnailElement, overlayImageURL, flip);
    });
}

// Get the URL of an image
function getImageURL(index) {
    console.log(`${imagesPath}${index}.webp`);
    return chrome.runtime.getURL(`${imagesPath}${index}.webp`);
}

// Checks if an image exists in the image folder
async function checkImageExistence(index) {
    try {
        const testedURL = getImageURL(index)

    return fetch(testedURL)
        .then(() => {
            return true
        }).catch(error => {
            return false
        })
    } catch (error) {
        return false
    }
}

////////////////////////
//  BrandonXLF Magic  //
////////////////////////

// Defines the N size of last images that will not be repeated.
const size_of_non_repeat = 8
// List of the index of the last N selected images.
const last_indexes = Array(size_of_non_repeat)

// Get a random image URL from a directory
function getRandomImageFromDirectory() {
    let randomIndex = -1

    // It selects a random index until it finds one that is not repeated
    while (last_indexes.includes(randomIndex) || randomIndex < 0) {
        randomIndex = Math.floor(Math.random() * highestImageIndex) + 1;
    }

    // When it finds the non repeating index, it eliminates the oldest value, and pushes the current index
    last_indexes.shift()
    last_indexes.push(randomIndex)

    return randomIndex
}

////////////////////////
//  BrandonXLF Magic  //
////////////////////////

function GetFlipBlocklist() {
    fetch(chrome.runtime.getURL(`${imagesPath}flip_blacklist.json`))
        .then(response => response.json())
        .then(data => {
            useAlternativeImages = data.useAlternativeImages;
            flipBlacklist = data.blacklistedImages;

            blacklistStatus = "Flip blacklist found. " + (useAlternativeImages ? "Images will be substituted." : "Images won't be flipped.")
        })
        .catch((error) => {
            blacklistStatus = "No flip blacklist found. Proceeding without it."
        });
}

GetFlipBlocklist()

// getHighestImageIndex()
//     .then(() => {
//         setInterval(applyOverlayToThumbnails, 100);
//         console.log(
//             "Borodulkify Loaded Successfully, " + highestImageIndex + " images detected. " + blacklistStatus
//         );
//     })

setInterval(applyOverlayToThumbnails, 100);
console.log(
    "Borodulkify Loaded Successfully, " + highestImageIndex + " images detected. " + blacklistStatus
);