// Document traversal helpers.
// Depends on: QA_CONFIG (global set by configLoader.jsx)

function isOnQALayer(item) {
    try {
        return item.layer && item.layer.name === QA_CONFIG.highlightLayerName;
    } catch (e) {
        return false;
    }
}

function getQALayer(doc) {
    for (var i = 0; i < doc.layers.length; i++) {
        if (doc.layers[i].name === QA_CONFIG.highlightLayerName) {
            return doc.layers[i];
        }
    }
    return null;
}

function removeQALayer(doc) {
    var layer = getQALayer(doc);
    if (layer) layer.remove();
}

function ensureQALayer(doc) {
    removeQALayer(doc);
    var layer = doc.layers.add();
    layer.name = QA_CONFIG.highlightLayerName;
    layer.printable = false;
    try {
        layer.zOrder(ZOrderMethod.BRINGTOFRONT);
    } catch (e) {
        try { layer.move(doc, ElementPlacement.PLACEATEND); } catch (e2) {}
    }
    return layer;
}

function walkPageItems(container, callback) {
    var items;
    try { items = container.pageItems; } catch (e) { return; }
    if (!items || items.length === 0) return;

    for (var i = items.length - 1; i >= 0; i--) {
        var item = items[i];
        if (isOnQALayer(item)) continue;
        callback(item);
        if (item.typename === "GroupItem") {
            walkPageItems(item, callback);
        }
    }
}

function walkAllPageItems(doc, callback) {
    for (var li = 0; li < doc.layers.length; li++) {
        var layer = doc.layers[li];
        if (layer.name === QA_CONFIG.highlightLayerName) continue;
        walkPageItems(layer, callback);
    }
}

function walkTextFrames(doc, callback) {
    walkAllPageItems(doc, function (item) {
        if (item.typename === "TextFrame") callback(item);
    });
}
