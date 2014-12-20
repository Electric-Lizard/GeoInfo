var GeoInfo = function() {
	if (!GeoInfo.prototype.instance) {
		GeoInfo.prototype.instance = this;
	} else return GeoInfo.prototype.instance;
	GeoInfo.prototype.getInfo = function(name, type) {
		GeoInfo.prototype.name = name;
		GeoInfo.prototype.type = type;
		var query;
		if (type == "fedDistrict") {
			query = "http://nominatim.openstreetmap.org/search?q=" + name + "&country=russia&format=json&polygon_geojson=1";
		} else if (type == "region") {
			query = "http://nominatim.openstreetmap.org/search?state=" + name + "&country=russia&format=json&polygon_geojson=1";
		} else {
			console.warn("Unexpected type '" + type + "', expecting 'fedDistrict' or 'region'");
			return false;
		}
		if (typeof Storage == "undefined") {
			console.warn("Your browser not support web storage");
		} else {
			var polygons = sessionStorage.polygons;
			if (typeof polygons !== "undefined") {
				polygons = JSON.parse(polygons);
				if (polygons.constructor === Array) {
					var i;
					for (i = 0; i < polygons.length; i++) {
						if (polygons[i].name == name && polygons[i].type == type) {
							console.log("Cache was used");
							return {coordinates: polygons[i].coordinates, center: polygons[i].center};
						}
					}
				}
			}
		}
		$.ajax({
			async: false,
			url: query,
			type: "GET",
			dataType: "json",
			success: function(json) {
				if (!json.length) {
					GeoInfo.prototype.response = false;
					return false;
				}
				var coordinates;
				if (json[0].geojson.type.toLowerCase() == "multipolygon") {
					coordinates = json[0].geojson.coordinates;
				} else coordinates = [json[0].geojson.coordinates];
				var polygon = getLargestPolygon(coordinates);
				var centroid = getCentroid(polygon.area, polygon.coordinates[0]);
				if (typeof sessionStorage.polygons != "undefined") {
					var polygons = JSON.parse(sessionStorage.polygons);
				} else var polygons = [];
				polygons.push({name: GeoInfo.prototype.name, type: GeoInfo.prototype.type, coordinates: polygon.coordinates[0], center: centroid});
				sessionStorage.polygons = JSON.stringify(polygons);
				GeoInfo.prototype.response = {coordinates: polygon.coordinates[0], center: centroid};
			},
			error: function(xhr, status, error) {
				console.warn("Connection error:" + error);
				return false;
			}
		})
		return GeoInfo.prototype.response;
	}
	function getCentroid(area, coordinates) {
		var i, sumX = 0, sumY = 0, p1, p2;
		for (i = 0; i < coordinates.length - 1; i++) {
			p1 = coordinates[i];
			p2 = coordinates[i+1];
			sumX += (p1[0] + p2[0]) * (p1[0]*p2[1] - p2[0]*p1[1]);
			sumY += (p1[1] + p2[1]) * (p1[0]*p2[1] - p2[0]*p1[1]);
		}
		return [1/(6*area)*sumX, 1/(6*area)*sumY];
	}
	function getLargestPolygon(coordinates) {
		var polygon, areas = [], largestPolygon;
		for (polygon = 0; polygon < coordinates.length; polygon++) {
			var coords = coordinates[polygon][0], area = 0, i, p1, p2;
			for (i = 0; i < coords.length - 1; i++) {
				p1 = coords[i];
				p2 = coords[i+1];
				area += p1[0]*p2[1]-p1[1]*p2[0];
			}
			area /= 2;
			if (!(typeof largestPolygon === "undefined")) {
				if (Math.abs(areas[largestPolygon]) < Math.abs(area)) largestPolygon = polygon;
			} else largestPolygon = polygon;
			areas.push(area);
		}
		return {area: areas[largestPolygon], coordinates: coordinates[largestPolygon]};
	}
}