"use strict";

function SimpleUrlRouter() {
    this.routeCount = 0;
    this.rootPath = null;
}

/**
 * @param {string} path
 * @param {function|Array|Object} data
 */
SimpleUrlRouter.prototype.addRoute = function (path, data) {
    // multiple items
    if (Array.isArray(data)) {
        for (var dataIndex = 0, dataCount = data.length; dataIndex < dataCount; dataIndex++)
            this.addRoute(path, data[dataIndex]);
    }
    else {
        var dataType = typeof data;
        // route function
        if (dataType == 'function') {
            var pathSegments = path.split("/");
            var pathSegmentCount = pathSegments.length;

            // insert root, if not there
            if ((pathSegmentCount == 0) || (pathSegments[0].length > 0)) {
                pathSegments.unshift("");
                pathSegmentCount++;
            }

            var pathData = null;
            for (var pathSegmentIndex = 0; pathSegmentIndex < pathSegmentCount; pathSegmentIndex++) {
                var pathSegment = pathSegments[pathSegmentIndex];

                var isNewPathData = false;

                // root segment
                if (pathSegmentIndex == 0) {
                    if (!this.rootPath) {
                        this.rootPath = {};
                        isNewPathData = true;
                    }
                    pathData = this.rootPath;
                }
                // subsequent segment
                else {
                    // ignore empty segments (e.g. by a double slash: /path//to)
                    if (pathSegment.length == 0)
                        continue;

                    // already has that segment?
                    if (pathSegment in pathData.segments) {
                        pathData = pathData.segments[pathSegment];
                    }
                    else {
                        pathData = pathData.segments[pathSegment] = {};
                        isNewPathData = true;
                    }
                }

                if (isNewPathData)
                    pathData.segments = {};
            }

            pathData.index = this.routeCount++;
            pathData.callback = data;
        }
        // path segments
        else if (dataType == 'object') {
            for (var nodeSegment in data) {
                if (data.hasOwnProperty(nodeSegment))
                    this.addRoute(path + '/' + nodeSegment, data[nodeSegment]);
            }
        }
        else
            throw new Error('Invalid data');
    }
};

SimpleUrlRouter.prototype.findRoute = function (urlPath) {
    var urlPathSegments = urlPath.split("/");
    var urlPathSegmentCount = urlPathSegments.length;

    // insert root, if not there
    if (urlPathSegmentCount == 0 || urlPathSegments[0].length > 0) {
        urlPathSegments.unshift("");
        urlPathSegmentCount++;
    }

    // drop trailing empty segments (except root)
    while (urlPathSegmentCount > 1 && urlPathSegments[urlPathSegmentCount - 1].length == 0) {
        urlPathSegments.pop();
        urlPathSegmentCount--;
    }

    var match = this._findRouteIterate(this.rootPath, '', urlPathSegments, 0, urlPathSegmentCount, -1, {});
    if (match)
        return {'callback': match.routeData.callback, 'parameters': match.parameters};
    return null;
};

SimpleUrlRouter.prototype._findRouteIterate = function (routePathData, routePathSegment, urlPathSegments, urlPathSegmentIndex, urlPathSegmentCount, lastMatchIndex, parameters) {
    if (!routePathData)
        return null;

    // find next non-empty url segment (except for root)
    do {
        if (urlPathSegmentIndex >= urlPathSegmentCount)
            return null;

        var urlPathSegment = urlPathSegments[urlPathSegmentIndex];
        var urlPathSegmentIsEmpty = (urlPathSegmentIndex != 0 && urlPathSegment.length == 0);
        if (urlPathSegmentIsEmpty)
            urlPathSegmentIndex++;
    } while (urlPathSegmentIsEmpty);

    var result = null;

    // Parameter segment
    if (routePathSegment.substr(0, 1) === ':') {
        parameters = cloneParameters(parameters);
        var parameterName = decodeURIComponent(routePathSegment.substr(1, routePathSegment.length - 1));
        parameters[parameterName] = decodeURIComponent(urlPathSegment);
        if ((urlPathSegmentIndex == urlPathSegmentCount - 1) && ('callback' in routePathData) && (routePathData.index > lastMatchIndex)) {
            result = {'routeData': routePathData, 'parameters': parameters};
            lastMatchIndex = routePathData.index;
        }
    }
    // Fixed segment
    else if (routePathSegment === urlPathSegments[urlPathSegmentIndex]) {
        if ((urlPathSegmentIndex == urlPathSegmentCount - 1) && ('callback' in routePathData) && (routePathData.index > lastMatchIndex)) {
            result = {'routeData': routePathData, 'parameters': parameters};
            lastMatchIndex = routePathData.index;
        }
    }
    else {
        return null;
    }

    // iterate children
    for (var routeChildPathSegment in routePathData.segments) {
        if (routePathData.segments.hasOwnProperty(routeChildPathSegment)) {
            var routeChildPathData = routePathData.segments[routeChildPathSegment];
            var routeChildResult = SimpleUrlRouter.prototype._findRouteIterate(routeChildPathData, routeChildPathSegment, urlPathSegments, urlPathSegmentIndex + 1, urlPathSegmentCount, lastMatchIndex, parameters);
            if (routeChildResult) {
                result = routeChildResult;
                lastMatchIndex = routeChildResult.routeData.index;
            }
        }
    }

    return result;
};

function cloneParameters(obj) {
    if (obj === null || typeof obj !== 'object')
        return obj;
    var temp = {};
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            temp[key] = obj[key];
    }
    return temp;
}

module.exports = SimpleUrlRouter;