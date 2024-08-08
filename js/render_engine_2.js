class SVGManipulator {

    static uuidv4() {
        var uuid = "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16));
        return `uuid_${uuid}`;
    }

    static gebi(id) {
        return document.getElementById(id);
    }

    static loadSVG_xmlhttp(url, checksum = null, giveID = null) {
        console.warn("loadSVG_xmlhttp is not yet implemented!");
        return null;
    }

    static uniqueID() {
        var lock = true;
        var new_id = -1;
        while (lock) {
            new_id = SVGManipulator.uuidv4();
            lock = (window.assigned_ids.includes(new_id));
        }
        return new_id
    }

    constructor(svg_element_id, rewrite_id = false) {
        // this corresponds to the actual SVG element
        this.svg_container = document.getElementById(svg_element_id);
		if (!this.svg_container) {
			console.error(`[svgmanipulator][${svg_element_id}] Bad SVG element ID.`);
			return null;
		} else {
			console.log(`[svgmanipulator][${svg_element_id}] Got SVG element!`, this.svg_container);
		}
        this.svg_id = structuredClone(svg_element_id);

        // this corresponds to the g element that holds all of the map elements; 
        // if there are more than one the SVG needs to be modified
        var groups = this.svg_container.querySelector("g");
        if (!groups) {
            console.error(`[svgmanipulator][${this.svg_id}][setCallbacks] No group element found (or bad parent element)! SVGManipulator creation fails.`);
            return null;
        } else {
            this.group_container = groups;
        }

        window.assigned_ids = []
        this.giveAllElementsId(rewrite_id); // every element needs an ID so that user supplied callbacks can reference it
        console.log(`[svgmanipulator][${this.svg_id}][initialization] OK! Just created a map element originating from ${this.svg_container.id} and consisting of ${this.group_container.children.length} elements.`);
    }

    giveAllElementsId(override_existing_id = false) {
        var newly_given_ids = {};
        // go through all of the elements and give ID to the ones that don't have it (or override = true, or if the ID is malformed)
        for (let i = 0; i < this.group_container.children.length; i += 1) {
            if (this.group_container.children[i].id && /[a-zA-Z]/.test(this.group_container.children[i].id.slice(0, 1)) == false) {
                var new_id = `corrected-${this.group_container.children[i].id}`;
                this.group_container.children[i].id = new_id;
                newly_given_ids[new_id] = this.group_container.children[i];
            } else if (!this.group_container.children[i].id || override_existing_id) {
                var lock = true;
                var new_id = SVGManipulator.uniqueID();
                this.group_container.children[i].id = new_id;
                window.assigned_ids.push(new_id);
                newly_given_ids[new_id] = this.group_container.children[i];
            }
        }
        console.log(`[svgmanipulator][${this.svg_id}][giveAllElementsId] OK! Just gave ${Object.keys(newly_given_ids).length} elements new IDs.`);
        console.log(newly_given_ids);
    }

    setCallbacks(listener, callback, id_must_contain = "*") {
        // stats 
        var appliedTo = [];
        // go through all of the elements
        for (let i = 0; i < this.group_container.children.length; i += 1) {
            var element_id = this.group_container.children[i].id;
            if (element_id.includes(id_must_contain) || id_must_contain == "*") {
                this.group_container.children[i][listener] = callback;
                appliedTo.push(element_id);
            }
        }
        // report stats
        console.log(`[svgmanipulator][${this.svg_id}][setCallbacks] OK! Applied this callback to ${appliedTo.length} elements using the criteria "${id_must_contain}".`);
        console.log(appliedTo);
        return appliedTo;
    }

    setCallbackParticularElement(id, listener, callback) {
        console.log(`[svgmanipulator][${this.svg_id}][setCallbackParticularElement] Attempting to set a callback to sub element ${id}`);
        var elem = this.group_container.querySelector("#" + id);
        if (!elem) {
            console.error(`[svgmanipulator][${this.svg_id}][setCallbackParticularElement] Unable to apply a callback to this particular element: ${id}`);
            return null;
        }
        elem[listener] = callback;
        return [id];
    }

    autoForEachElement(execute, id_must_contain = "*", use_function_foreach = false) {
        // This will call a function and provide an element ID for every element that meets the condition.
        // stats 
        var appliedTo = [];
        // go through all of the elements
        // this is to make sure that you don't enter an infinite loop if you add to the SVG document by using autoForEachElement()
        // there is also the rule that you are not allowed to perform any deletions using this function because we're just using a normal for loop
        if (use_function_foreach == false) {
            var pre_addition_length = structuredClone(this.group_container.children.length);
            for (let i = 0; i < pre_addition_length; i += 1) {
                var element_id = this.group_container.children[i].id;
                if (element_id.includes(id_must_contain) || id_must_contain == "*") {
                    execute(element_id)
                    appliedTo.push(element_id);
                    //alert(element_id);
                }
            }
        } else {
            window.tatap = appliedTo;
            window.texec = execute;
            window.idmcs = id_must_contain;
            [].slice.call(this.group_container.children).forEach(function(el) {
                //console.log(el);
                if (el.id.includes(window.idmcs) || window.idmcs == "*") {
                    window.texec(el.id);
                    window.tatap.push(el.id);
                }
            });
        }
        // report stats
        console.log(`[svgmanipulator][${this.svg_id}][autoForEachElement] OK! Executed function ${execute.name} to ${appliedTo.length} elements using the criteria "${id_must_contain}".`);
        console.log(appliedTo);
        return appliedTo;
    }

    removeElementWithId(id) {
        var elem = this.group_container.querySelector("#" + id);
        if (!elem) {
            console.error(`[svgmanipulator][${this.svg_id}][removeElementWithId] Could not find element with ID ${id} to remove.`);
            return null;
        } else elem.remove();
        return id;
    }

    retrieve_property(id, attribute) {
        var elem = this.group_container.querySelector("#" + id);
        if (!elem) {
            console.error(`[svgmanipulator][${this.svg_id}][retrieve_property] Could not find element with ID ${id} to lookup.`);
            return null;
        } else return SVGManipulator.gebi(id).getAttributeNS(null, attribute);
    }

    retrieve_element_in_this_group(id, suppress_error) {
        var elem = this.group_container.querySelector("#" + id);
        if (!elem && !suppress_error) {
            console.error(`[svgmanipulator][${this.svg_id}][retrieve_element_in_this_group] Could not find element with ID ${id} to lookup.`);
            return null;
        } else if (!elem) {
            return null;
        } else return elem; // returns a reference to the desired element
    }

    set_property(id, attribute, value) {
        var elem = this.group_container.querySelector("#" + id);
        if (!elem) {
            console.error(`[svgmanipulator][${this.svg_id}][set_property] Could not find element with ID ${id} to modify.`);
            return null;
        }
        SVGManipulator.gebi(id).setAttributeNS(null, attribute, value);
    }

    remove_property(id, attribute) {
        var elem = this.group_container.querySelector("#" + id);
        if (!elem) {
            console.error(`[svgmanipulator][${this.svg_id}][remove_property] Could not find element with ID ${id} to remote attributes on.`);
            return null;
        }
        SVGManipulator.gebi(id).removeAttributeNS(null, attribute);
    }

    export_document() {
        return this.svg_container.outerHTML;
    }
}

// This class not only represents a clickable SVG document but also the attached map dataset and some other information that is separate from the SVG image.
class PVMap extends SVGManipulator {

    static loadSVGToDOMIfNotAlreadyLoaded(svg_content, parent_element = null) {
        // If the SVG document's location is known but it has not already been loaded into the DOM, 
        // we should load that before creating a PVMap representation
        if (!parent_element) var toAttachTo = document;
        else var toAttachTo = parent_element;
        let svgNS = "http://www.w3.org/2000/svg";
        let svgElement = document.createElementNS(svgNS, "svg");
        var appRes = toAttachTo.appendChild(svgElement);
        svgElement.outerHTML = svg_content;
        console.log(`[PVMap STATIC][loadSVGToDOMIfNotAlreadyLoaded] OK! Loaded ${svg_content.length} bytes of SVG map data into parent element ${parent_element}.`);
		var dp = new DOMParser();
		return dp.parseFromString(svg_content, "application/xml").querySelector("svg").getAttributeNS(null, "id");
    }

    constructor(initial_configuration_data, toggleable_layer_data, feature_data) {
        super(initial_configuration_data.svg_element_id, false);
        console.log(`[${this.svg_id}][initialization] Bound.`)
            // Ideally, the maps that people are going to be loading will already have SVG elements with appropriate IDs (i.e. "RM:131A")
            // which means we should pass FALSE to "overwrite_all_id" in super( );
        this.featuredata = feature_data; // expected to be an array [0: ..., 1: ..., etc] of JSON objects with certain attributes such as landmark_id. used when displaying layers and also for searching. the reason why we do NOT make a copy and instead take a reference to an external object is so that the feature data can be updated automatically without having to notify PVMap objects that their map data has changed.
        this.feature_data_index_lookup = {};
        this.layerdata = structuredClone(toggleable_layer_data); // also expected to be an array of JSON objects that contain certain attributes such as layer_name. the reason why we need a copy of this object is that we want to be able to modify this.layerdata without inadvertently modifying an object outside of PVMap class.
        // we no longer need this.make_clickable since clickability is determined by registration in the feature dataset instead of just by ID
        this.desktop_default_x = initial_configuration_data.default_xy_desktop[0];
        this.desktop_default_y = initial_configuration_data.default_xy_desktop[1];
        this.desktop_default_zoom = initial_configuration_data.default_zoom_desktop;
        this.mobile_default_x = initial_configuration_data.default_xy_mobile[0];
        this.mobile_default_y = initial_configuration_data.default_xy_mobile[1];
        this.mobile_default_zoom = initial_configuration_data.default_zoom_mobile;
        this.double_clickcallback = initial_configuration_data.double_click_callback;
        this.autogen_layerboxes = initial_configuration_data.autogenerate_layer_checkboxes_under_element;
        // Create a globally accessible reference to this PVMap object for the purpose of setting callbacks
        window[this.svg_id] = this;
        // Make all the desired elements selectable (to be selectable, a certain SVG element needs to have a corresponding entry in featuredata with a matching landmark_id AND that entry has to be marked as a physical location)
        console.log(`[${this.svg_id}][initialize] Reading dataset for registered places and making them selectable...`);
        for (let i = 0; i < this.featuredata.length; i += 1) {
            // Denote the index/position of this particular feature in featuredata (since featuredata is an array, if you want to look up, for instance, "CR-1139", there's no way to do that except go through every feature and use an if
            // So we will have a cached, ready to use list available for that functionaclity
            this.feature_data_index_lookup[this.featuredata[i].landmark_id] = i;

            // Check to make sure that this registered place corresponds to a room on the map
            if (this.featuredata[i].physical_location != "yes") {
                console.log(`[${this.svg_id}][initialize] Element ${this.featuredata[i].landmark_id} is not marked as a physical place that can be selected; will not attempt to find the corresponding place on the SVG map. Continuing...`);
                continue;
            }
            // If the dataset says that this feature DOES CORRESPOND to a place on the map, try to set it's onhover listener
            var ret = this.setCallbackParticularElement(this.featuredata[i].landmark_id, "onmouseover", function(evt) {
                window[evt.target.parentElement.parentElement.id].changeBorder(evt.target.id);
                PVMap.gebi("selecting").innerHTML = `hovering: ${evt.target.id}`;
            });
            // If it doesn't work, the dataset has a "phsyical" feature listed which doesn't have a corresponding element on the map. It's like saying that 
            // there is an business complex at 134 Main St. in your town when in reality your town doesn't have a Main St at all.
            if (!ret) console.warn(`[${this.svg_id}][initialize] ${this.featuredata[i].landmark_id} is listed as a physical place that should be selectable; but no such physical polygon/path with this landmark_id exists on this SVG map.`);
            else {
                this.setCallbackParticularElement(this.featuredata[i].landmark_id, "onmouseout", function(evt) {
                    window[evt.target.parentElement.parentElement.id].clearFX(evt.target.id);
                    PVMap.gebi("selecting").innerHTML = `hovering: [none]`;
                });
                this.setCallbackParticularElement(this.featuredata[i].landmark_id, "onmousedown", function(evt) {
                    window[evt.target.parentElement.parentElement.id].changeBorder(evt.target.id, "#777700", "8px");
                });
                this.setCallbackParticularElement(this.featuredata[i].landmark_id, "onmouseup", function(evt) {
                    window[evt.target.parentElement.parentElement.id].changeBorder(evt.target.id);
                });
                this.setCallbackParticularElement(this.featuredata[i].landmark_id, "ontouchstart", function(evt) {
					window.lastTapX = evt.targetTouches[0].clientX;
					window.lastTapY = evt.targetTouches[0].clientY;
				});
                this.setCallbackParticularElement(this.featuredata[i].landmark_id, "ontouchend", function(evt) {
					if (evt.changedTouches && evt.changedTouches.length > 0) { // because the "text element triggers attached path's ontouchend event" doesn't provide a changedTouches property, we can't always be sure that there was an x and y.
						var x = evt.changedTouches[0].clientX;
						var y = evt.changedTouches[0].clientY;
					} else {
						var x = -1;
						var y = -1;
					}
					if (evt.manuallyTriggered || (x == window.lastTapX && y == window.lastTapY)) { // if it was manually triggered, we know that the event was fired by a text element relaying the message on and we should consider it a tap in the same location and thus fire the double click event
						window[evt.target.parentElement.parentElement.id].changeBorder(evt.target.id);
						setTimeout(function(){
							window[evt.target.parentElement.parentElement.id].double_clickcallback(evt);
							window[evt.target.parentElement.parentElement.id].clearFX(evt.target.id);
						}, 100);
					}
				});
                this.setCallbackParticularElement(this.featuredata[i].landmark_id, "ondblclick", this.double_clickcallback);
            }
        }
        // Add a "registered elements" attribute to every layer data 
        for (let i = 0; i < this.layerdata.length; i += 1) {
            if (this.layerdata[i].layer_id) this.layerdata[i].applicable_elements = [];
        }


        // Initialize the layer data checkboxes, if the user has specified a parent element to stick the checkboxes in
        if (this.autogen_layerboxes) {
			var container = PVMap.gebi(this.autogen_layerboxes);
			if (!container) {
				console.error(`[${this.svg_id}][initialize] The constructor could not find the HTML container element to append layer data checkboxes to while attempting to create layer checkboxes. Initialization failed.`);
				return null;
			}
			
            for (let i = 0; i < this.layerdata.length; i += 1) {
				if (this.layerdata[i].layer_id) {
					// First, we have to create the actual checkbox element
					var newCB = document.createElement('input');
					newCB.type = "checkbox";
					newCB.id = `${this.svg_id}__${this.layerdata[i].layer_id}`;
					newCB.checked = this.layerdata[i].visible;
					var newLB = document.createElement('label');
					newLB.setAttribute("for", newCB.id);
					newLB.textContent = `${this.layerdata[i].layer_name}`;
					// Second, we have to append the checkbox and label to the container element
					container.append(document.createElement("br"));
					container.append(newCB);
					container.append(newLB);
				} else if (this.layerdata[i].category_name) {
					container.append(document.createElement("br"));
					container.append(document.createElement("br"));
					var newH = document.createElement('u');
					newH.textContent = this.layerdata[i].category_name;
					container.append(newH);
				}
            }
            // Now that all checkboxes are loaded in, we can now applyLayerCheckboxesForThisMap();
            this.applyLayerCheckboxesForThisMap();

            // Don't forget to add a button that applies changes
            container.append(document.createElement("br"));
            container.append(document.createElement("br"));
            var APB = document.createElement("button");
            APB.id = `${this.svg_id}__applybutton`;
            APB.onclick = function(evt) {
                window[evt.target.id.split("__")[0]].applyLayerCheckboxesForThisMap(true);
            }
            APB.innerText = `Apply changes`;
            container.append(APB);
        } else {
            console.log(`[${this.svg_id}][initialize] Will not create layer checkboxes and append them to webpage.`);
        }
    }

    // Clamps function for font calculations
    static clamp(x, min, max) {
        return Math.max(min, Math.min(x, max));
    }

    lookupFeatureIndex(id) {
        var tr = this.feature_data_index_lookup[id];
        if (tr != undefined) return tr;
        else return null;
    }

    lookupFeatureObject(id) {
        var tr = this.feature_data_index_lookup[id];
        if (tr != undefined) return this.featuredata[tr];
        else return null;
    }

    // Helper for all of these
    helper_obtainAnimationNode(id, attribute, values, duration) {
        var newAni = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        newAni.setAttributeNS(null, "attributeType", "XML");
        newAni.setAttributeNS(null, "repeatCount", "indefinite");
        newAni.setAttributeNS(null, "attributeName", attribute);
        newAni.setAttributeNS(null, "values", values);
        newAni.setAttributeNS(null, "dur", duration);
        return newAni;
    }

    // This will set the border nondestructively
    changeBorder(id, color = "#FFFF00FF", width = "8px") {
        var elem = this.retrieve_element_in_this_group(id);
        if (!elem) {
            console.error(`[${this.svg_id}][setBorder] Unable to find element with ID ${id} during lookup.`)
            return null;
        }
        elem.append(this.helper_obtainAnimationNode(`staticBorder_vfx__${id}`, "stroke", color, "0.8s"));
        elem.append(this.helper_obtainAnimationNode(`staticBorder_vfx__${id}`, "stroke-width", `${width}`, "0.8s"));
		console.log(`[${this.svg_id}][changeBorder] OK, applied new border to ${id}.`);
    }

    // This will flash the border
    flashBorder(id, colors = "#FFFF00FF;#999999FF", width = "15px", rate = "0.8s") {
        var elem = this.retrieve_element_in_this_group(id);
        if (!elem) {
            console.error(`[${this.svg_id}][flashBorder] Unable to find element with ID ${id} during lookup.`)
            return null;
        }
        elem.append(this.helper_obtainAnimationNode(`flashBorder_width_vfx__${id}`, "stroke-width", `${width}`, "0.8s"));
        elem.append(this.helper_obtainAnimationNode(`flashBorder_vfx__${id}`, "stroke", colors, rate));
		console.log(`[${this.svg_id}][flashBorder] OK, applied flashing border to ${id}.`);
    }

    // This will clear FX
    clearFX(id) {
        var elem = this.retrieve_element_in_this_group(id);
		console.log(`[${this.svg_id}][clearFX] Clearing ${id} of FX...`);
        if (!elem) {
            console.error(`[${this.svg_id}][clearFX] Unable to find element with ID ${id} during lookup.`);
            return null;
        }
        elem.querySelectorAll("animate").forEach(function(em) {
			console.log(`    + Clearing FX ${em}`);
            em.remove();
        });
    }

    clearFXAll() {
		console.log(`[${this.svg_id}][clearFXAll] Clearing ALL FX`)
        this.group_container.querySelectorAll("animate").forEach(function(em) {
			console.log(`    + Clearing FX ${em}`);
            em.remove();
        });
    }

    // This will place text in the middle of a given path 
    placeText(content, id = null, box_id = null, x = -1, y = -1, color = "#FFFF00", font_size = ["auto", 12, 24], font = "Arial") {
		console.log(`[${this.svg_id}][placeTextInPath] Placing text: ${content} on ${box_id} with new ID # ${id}`);
        // The first thing we have to do is calculate the centroid of this path
        // Setting either x or y to a negative number will trigger auto place based on the box ID
        if ((x < 0 || y < 0) && box_id) {
            var centroid = this.helper_calculatePathCentroid(box_id);
            if (!centroid) {
                console.error(`[${this.svg_id}][placeTextInPath] Unable to place text in the center of this element. Place text fails.`);
                return null;
            }
        } else if (x > 0 && y > 0 && !box_id) { // setting either x or y to be positive and leaving box_id blank will trigger manual placement
            var centroid = [x, y];
        } else {
            console.error(`[${this.svg_id}][placeTextInPath] Program is attempting automatic placement without providing a path_id, or is attempting to attempt manual placement while also providing a path_id for the text to be placed in. Operation fails due to conflicting inputs.`);
            return null;
            // any other combination is invalid and will result in failure
        }

        // Now we need an ID for this thing
        var new_id = 0;
        if (id) new_id = id
        else new_id = PVMap.uniqueID();
        if (this.retrieve_element_in_this_group(new_id, true)) {
            console.error(`[${this.svg_id}][placeTextInPath] Unable to place new text due to ID collision: ${new_id} already exists in this map!`);
            return null;
        }

        // Now we actually make the text and style it up
        var newTN = document.createElementNS("http://www.w3.org/2000/svg", "text");
        newTN.setAttributeNS(null, "x", centroid[0]);
        newTN.setAttributeNS(null, "y", centroid[1]);
        newTN.setAttributeNS(null, "text-anchor", "middle");
        newTN.setAttributeNS(null, "stroke", color);
        newTN.setAttributeNS(null, "fill", color);
        newTN.setAttributeNS(null, "alignment-baseline", "middle");
        newTN.setAttributeNS(null, "font-family", font);
        newTN.setAttributeNS(null, "id", new_id);
        // In order to accomodate multiple lines of text, we have to break the text content up into multiple tspan elements
        // since SVG will not render/recognize the newline character on its own in text elements.
        var lines = content.split("\n");
        if (lines.length < 2) newTN.textContent = content;
        else {
            for (let i = 0; i < lines.length; i += 1) {
                // 1. create multiple tspan elements
                var newTS = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
                newTS.setAttributeNS(null, "x", centroid[0]);
                newTS.setAttributeNS(null, "dy", "1em");
                newTS.textContent = lines[i];
                newTN.appendChild(newTS);
            }
        }
        // This code is for automatic font sizing based on container size
        // It also makes accounts for multiline text offsetting the text downwards
        if (Array.isArray(font_size) && font_size.length == 3 && font_size[0] == "auto" && box_id) {
            // calculate appropriate text size based off the bbox of the parent
            var bounds = PVMap.gebi(box_id).getBBox();
            newTN.setAttributeNS(null, "font-size", bounds.height); // set it initially so that the font is as tall as the destination path
            this.group_container.append(newTN);
            var desired_width_of_text = bounds.width * 0.8;
            var initial_width_of_text = newTN.getBBox().width;
            //console.log(desired_width_of_text, initial_width_of_text);
            var scaling_factor = desired_width_of_text / initial_width_of_text;
            var new_font_size = PVMap.clamp(Math.round(scaling_factor * bounds.height), font_size[1], font_size[2]);
            newTN.setAttributeNS(null, "font-size", new_font_size); // once we have the desired font size, set it
            // account for multiline text shift
            if (box_id && x < 0 && y < 0) {
                var parent_bounds = PVMap.gebi(box_id).getBBox();
                var midpoint_of_parent_bounds = parent_bounds.y + (parent_bounds.height / 2);
                var text_box_bounds = PVMap.gebi(new_id).getBBox();
                var midpoint_of_text_box = text_box_bounds.y + (text_box_bounds.height / 2);
                newTN.setAttributeNS(null, "y", centroid[1] - (midpoint_of_text_box - midpoint_of_parent_bounds));
                //console.log(centroid[1] - (midpoint_of_text_box - midpoint_of_parent_bounds));
                //console.log((midpoint_of_text_box - midpoint_of_parent_bounds));
            }
        } else if (Array.isArray(font_size) && (!box_id || x > 0 || y > 0)) {
            console.error(`[${this.svg_id}][placeTextInPath] Auto font size cannot be used when automatic central placement is not being used or the path_id is not specified.`);
			return null;
        } else {
            newTN.setAttributeNS(null, "font-size", font_size);
            this.group_container.append(newTN);
            // account for multiline text shift
            if (box_id && x < 0 && y < 0) {
                var parent_bounds = PVMap.gebi(box_id).getBBox();
                var midpoint_of_parent_bounds = parent_bounds.y + (parent_bounds.height / 2);
                var text_box_bounds = PVMap.gebi(new_id).getBBox();
                var midpoint_of_text_box = text_box_bounds.y + (text_box_bounds.height / 2);
                newTN.setAttributeNS(null, "y", centroid[1] - (midpoint_of_text_box - midpoint_of_parent_bounds));
                console.log(centroid[1] - (midpoint_of_text_box - midpoint_of_parent_bounds));
                console.log((midpoint_of_text_box - midpoint_of_parent_bounds));
            }
        }

        // make it so that the text can also be used to activate the same callbacks
		// (these callbacks ONLY work when the ID of the text is "text__(existing parent element)" -- if another format is used it will not find its way back to the correct parent
        this.setCallbackParticularElement(new_id, "onmouseover", function(evt) {
            var elem = window[evt.target.parentElement.parentElement.parentElement.id].retrieve_element_in_this_group(evt.target.parentElement.id.split("__")[1]); // this is a very roundabout way of being able to retrieve the non-text companion to this text element (which you can't reach just by using parentElement)
            elem.dispatchEvent(new Event('mouseover')); // once we've gone all the way around through the globally accessible object for this PVMap, dispatch its mouseover/whatever event
        });
        this.setCallbackParticularElement(new_id, "onmouseout", function(evt) {
            var elem = window[evt.target.parentElement.parentElement.parentElement.id].retrieve_element_in_this_group(evt.target.parentElement.id.split("__")[1]);
            elem.dispatchEvent(new Event('mouseout'));
        });
        this.setCallbackParticularElement(new_id, "ondblclick",
            function(evt) {
                var elem = window[evt.target.parentElement.parentElement.parentElement.id].retrieve_element_in_this_group(evt.target.parentElement.id.split("__")[1]);
                var clickEvent = document.createEvent('MouseEvents');
                clickEvent.initEvent('dblclick', true, true);
                elem.dispatchEvent(clickEvent);
            }
        );
        this.setCallbackParticularElement(new_id, "onclick",
            function(evt) {
                var elem = window[evt.target.parentElement.parentElement.parentElement.id].retrieve_element_in_this_group(evt.target.parentElement.id.split("__")[1]);
                var clickEvent = document.createEvent('MouseEvents');
                clickEvent.initEvent('click', true, true);
                elem.dispatchEvent(clickEvent);
            }
        );
		this.setCallbackParticularElement(new_id, "ontouchstart", function(evt) {
			window.lastTapX = evt.targetTouches[0].clientX;
			window.lastTapY = evt.targetTouches[0].clientY;
		});
		this.setCallbackParticularElement(new_id, "ontouchend", function(evt) {
			var x = evt.changedTouches[0].clientX;
			var y = evt.changedTouches[0].clientY;
			if (x == window.lastTapX && y == window.lastTapY) {
				var elem = window[evt.target.parentElement.parentElement.parentElement.id].retrieve_element_in_this_group(evt.target.parentElement.id.split("__")[1]);
                var clickEvent = document.createEvent('TouchEvent');
                clickEvent.initEvent('touchend', true, true);
				clickEvent.manuallyTriggered = true;
                elem.dispatchEvent(clickEvent);
			}
		});


        console.log(`[${this.svg_id}][placeTextInPath] SVG element has ID # ${new_id}; new ID returned by fn.`);
        return new_id;
    }

    // Taken from d3.js's polygon tools, src: https://github.com/d3/d3-polygon/blob/main/src/centroid.js
    // Calculates the center of a path
    helper_calculatePathCentroid(id) {
        var path_data = this.retrieve_property(id, "d");
        if (!path_data) {
            console.error(`[${this.svg_id}][calculatePathCentroid] Unable to lookup path data for object with ID ${id}.`);
            return null;
        }
        var polygon = this.helper_pathDatatoVertices(path_data);
        if (polygon.length < 3) {
            console.warn(`[${this.svg_id}][calculatePathCentroid] This path does not have at least 3 vertices. There is no centroid, null returned.`);
            return null;
        }


        var i = -1,
            n = polygon.length,
            x = 0,
            y = 0,
            a,
            b = polygon[n - 1],
            c,
            k = 0;

        while (++i < n) {
            a = b;
            b = polygon[i];
            k += c = a[0] * b[1] - b[0] * a[1];
            x += (a[0] + b[0]) * c;
            y += (a[1] + b[1]) * c;
        }

        return k *= 3, [x / k, y / k];
    }

    // This is a function that takes in SVG path data and extracts the coordinates out of the pen movement/styling commands 
    helper_pathDatatoVertices(pathData) {
        function splitByLetter(inputString) {
            const segments = inputString.split(/(?=[a-zA-Z])(?<=[^a-zA-Z])|(?=[^a-zA-Z])(?<=[a-zA-Z])/); // regex by ChatGPT
            return segments.filter(segment => segment.trim() !== '');
        }

        var cut_up = splitByLetter(pathData);
        var vertices = [];
        var cX = 0;
        var cY = 0;
        var numbers = [];

        for (let i = 0; i < cut_up.length; i += 2) {
            if (cut_up[i] == "L" || cut_up[i] == "M") {
                numbers = cut_up[i + 1].split(" ");
                cX = Number(numbers[0]);
                cY = Number(numbers[1]);
                vertices.push([cX, cY]);
            } else if (cut_up[i] == "l" || cut_up[i] == "m") {
                var numbers = cut_up[i + 1].split(" ");
                cX += Number(numbers[0]);
                cY += Number(numbers[1]);
                vertices.push([cX, cY]);
            } else {
                console.warn(`[${this.svg_id}][pathDatatoVertices] Unsupported SVG command to convert into coordinates: ${cut_up[i]} in ${pathData}`)
            }
        }

        return vertices;
    }

    // Runs through the list of features and checks if any of the layers apply; if yes, then illuminate/add text/etc. as per the layer instructions.
    // For instance:
    // Room 1487:
    //    is classroom and has room number? YES => place room number text in 
    //    is classroom and is weather safe? YES => make background dark blue
    // There is an option as to whether or not the other modifications (i.e. highlighted cells, text) should be cleared off first
    applyLayerCheckboxesForThisMap(clear_off_prior_addins = false) {
        var featuredata_workingcopy = structuredClone(this.featuredata);
        var id_to_feature_index = {}; // when you want to, for instance, modify the styling data on CR-1139, you don't know which position that is in featuredata (because featuredata is just an array), so instead of for looping through featureindex until you find the one that has it, you use the precomputed lookup table
        for (let i = 0; i < featuredata_workingcopy.length; i += 1) {
            var currentObj = featuredata_workingcopy[i];
            currentObj.newTextColor = "";
            currentObj.newFontSize = "";
            currentObj.newFont = "";
            currentObj.tc = "";
            id_to_feature_index[currentObj.landmark_id] = i;
        }

        // Erase the memory of the layer data's known members
        for (let i = 0; i < this.layerdata.length; i += 1) {
            if (this.layerdata[i].layer_id) this.layerdata[i].applicable_elements = [];
        }

        // Before we work on layer data, we need to update the visibility attributes of the layer data based on the checkboxes
        // (but we'll only do this if the user generated checkboxes...)
        if (this.autogen_layerboxes) {
            for (let i = 0; i < this.layerdata.length; i += 1) {
				if (!this.layerdata[i].layer_id) continue;
                this.layerdata[i].visible = PVMap.gebi(`${this.svg_id}__${this.layerdata[i].layer_id}`).checked;
                console.log(`[${this.svg_id}][applyLayerCheckboxesForThisMap] Layer ${this.layerdata[i].layer_id} enabled: ${this.layerdata[i].visible}`);
            }
        }


        for (let i = 0; i < featuredata_workingcopy.length; i += 1) {
            currentObj = featuredata_workingcopy[i];
            console.log(`[${this.svg_id}][applyLayerCheckboxesForThisMap] Working on ${featuredata_workingcopy[i].landmark_id}...`);
            for (let j = 0; j < this.layerdata.length; j += 1) {
				if (!this.layerdata[j].layer_id) continue;
                console.log(`&& Layer ${this.layerdata[j].layer_id}`);
                // First, we check if this particular landmark is a part of the given layer
                var jointQueryCmd = this.layerdata[j].layer_instructions.split("=>");
                if (jointQueryCmd.length != 2) {
                    console.warn(`[${this.svg_id}][applyLayerCheckboxesForThisMap] Bad layer command: ${jointQueryCmd}. Layer rendering will proceed; however, this layer will not be rendered.`);
                    continue;
                }
                if (this.helper_evaluateQuery(jointQueryCmd[0], currentObj)[0]) {
                    // If the feature matches the current layer, even if it is not visible, add it to the register
                    this.layerdata[j].applicable_elements.push(currentObj.landmark_id);

                    if (this.layerdata[j].visible == false) {
                        continue;
                    }

                    // If the feature matches the current layer AND the layer is visible, we act on the commands provided by the layer
                    var commands = jointQueryCmd[1].split(";");
                    for (let k = 0; k < commands.length; k += 1) {
                        var command = commands[k].trim().replaceAll(")", "");
                        if (!command) continue; // If the user left a ; on the end resulting in an empty command
                        var params = command.split("(")[1].split(",");
                        for (let m = 0; m < params.length; m += 1) {
                            params[m] = params[m].trim();
                            if (params[m].slice(0, 1) == "$") {
                                params[m] = String(currentObj[params[m].slice(1)]);
                                if (params[m] == "undefined") params[m] = "";
                            }
                        }
                        switch (command.split("(")[0]) {
                            case "set_semiauto_font_size":
                                console.log(`  x set_semiauto_font_size: ${params}`);
                                if (id_to_feature_index[params[0]] == undefined || id_to_feature_index[params[0]] == null || params.length != 3) {
                                    console.warn(`  - Bad parameter #0 (ID of landmark to change styling of) or incorrect number of parameters. Will proceed, but may result in faulty layer rendering.`);
                                    break;
                                }
                                featuredata_workingcopy[id_to_feature_index[params[0]]].newFontSize = ["auto", params[1], params[2]];
                                break;
                            case "set_manual_font_size":
                                console.log(`  x set_manual_font_size: ${params}`);
                                if (id_to_feature_index[params[0]] == undefined || id_to_feature_index[params[0]] == null || params.length != 2) {
                                    console.warn(`  - Bad parameter #0 (ID of landmark to change styling of) or incorrect number of parameters. Will proceed, but may result in faulty layer rendering.`);
                                    break;
                                }
                                featuredata_workingcopy[id_to_feature_index[params[0]]].newFontSize = params[1];
                                break;
                            case "set_font":
                                console.log(`  x set_font: ${params}`);
                                if (id_to_feature_index[params[0]] == undefined || id_to_feature_index[params[0]] == null || params.length != 2) {
                                    console.warn(`  - Bad parameter #0 (ID of landmark to change styling of) or incorrect number of parameters. Will proceed, but may result in faulty layer rendering.`);
                                    break;
                                }
                                featuredata_workingcopy[id_to_feature_index[params[0]]].newFont = params[1];
                                break;
                            case "set_text_color":
                                console.log(`  x set_text_color: ${params}`);
                                if (id_to_feature_index[params[0]] == undefined || id_to_feature_index[params[0]] == null || params.length != 2) {
                                    console.warn(`  - Bad parameter #0 (ID of landmark to change styling of) or incorrect number of parameters. Will proceed, but may result in faulty layer rendering.`);
                                    break;
                                }
                                featuredata_workingcopy[id_to_feature_index[params[0]]].newTextColor = params[1];
                                break;
                            case "cell_append_text":
                                console.log(`  x cell_append_text: ${params}`);
                                if (id_to_feature_index[params[0]] == undefined || id_to_feature_index[params[0]] == null || params.length != 2) {
                                    console.warn(`  - Bad parameter #0 (ID of landmark to change styling of) or incorrect number of parameters. Will proceed, but may result in faulty layer rendering.`);
                                    break;
                                }
                                featuredata_workingcopy[id_to_feature_index[params[0]]].tc += `${params[1]}\n`;
                                break;
                        }
                    }
                }
            }
        }
        console.log(`[${this.svg_id}][applyLayerCheckboxesForThisMap] Finished applying layer commands to features. Will now push these changes to the SVG map. Changes made:`);
        console.log(featuredata_workingcopy);
        if (clear_off_prior_addins) {
            window.tco = this;
            this.autoForEachElement(function(id) {
                window.tco.removeElementWithId(id);
            }, "text__", true); // true because we are destroying children in this.group_container.children, which means a traditional for loop will not work
        }
        for (let i = 0; i < featuredata_workingcopy.length; i += 1) {
            currentObj = featuredata_workingcopy[i];
            if (currentObj.tc && currentObj.newFontSize) {
                // If a new text object was placed by layer commands
                if (!currentObj.newFont) currentObj.newFont = "Lucida Console";
                if (!currentObj.newFont) currentObj.newTextColor = "lightgreen";
                this.placeText(currentObj.tc, `text__${currentObj.landmark_id}`, currentObj.landmark_id, -2, -2, currentObj.newTextColor, currentObj.newFontSize, currentObj.newFont);
            }
        }
    }

    searchForInThisMap(search_term) {
        // like in applyLayerCheckboxesForThisMap, we also want a copy of the data so we do not inadvertently modify outside variables in doing our work 
        var featuredata_workingcopy = structuredClone(this.featuredata);
        var positiveResults = [];
        var individualResult = false;

        for (let i = 0; i < featuredata_workingcopy.length; i++) {
            // we do this when we look over each element so that way $query becomes a valid variable
            // (because the search queries attached to each layer look something like {$query,@=,$official_room_number}
            featuredata_workingcopy[i].query = search_term;
            for (let j = 0; j < this.layerdata.length; j++) {
				if (!this.layerdata[j].layer_id) continue;
                individualResult = false;
                individualResult = this.helper_evaluateQuery(this.layerdata[j].layer_querying_conditions, featuredata_workingcopy[i])[0];
                if (individualResult && !positiveResults.includes(featuredata_workingcopy[i].landmark_id)) positiveResults.push(featuredata_workingcopy[i].landmark_id);
            }
        }

        return positiveResults;
    }

    // Uses a given criteria and checks it up against a feature (these criteria include things like "is a classroom? registered under a room number?"
    // This is a separate function because it's multiple other functions (applyCheckbox, searchFor) use it, which means it makes sense to place it in a separate place instead of embedding it in one place. 
    // Remember that this function returns an array: the first element being a true/false and the other an explanation of how the true/false result was achieved
    helper_evaluateQuery(layer_query, feature) {
        console.log(`  + [${this.svg_id}][evaluateQuery] Checking ${feature.landmark_id} against ${layer_query}`);
        var conditions_and_instructions = [layer_query];
        var search_index = conditions_and_instructions[0].indexOf("{", 0);
        var other_end = 1;
        var content_in_between = "";
        var content = "";
        var operators = [];
        var to_replace_content = false;
        while (search_index >= 0) {
            other_end = conditions_and_instructions[0].indexOf("}", search_index);
            content = conditions_and_instructions[0].slice(search_index, other_end + 1);
            content_in_between = conditions_and_instructions[0].slice(search_index + 1, other_end);
            //console.log(content_in_between);
            operators = content_in_between.split(",");
            if ((2 <= operators.length <= 3) == false) {
                console.error(`  - [${this.svg_id}][evaluateQuery] Bad condition: malformed qualifiers: ${content}, operators = ${operators}`);
                return null;
            }
            console.log(`    + Checking ${content}`);
            if (operators[0].slice(0, 1) == "$") {
                console.log(`    + $op0:${operators[0]} transformation:`);
                operators[0] = String(feature[operators[0].slice(1)]);
                if (operators[0] == "undefined") operators[0] = "";
                console.log(`    + ${operators[0]}`);
            }
            if (operators[2] && operators[2].slice(0, 1) == "$") {
                console.log(`    + $op1:${operators[0]} transformation:`);
                operators[2] = String(feature[operators[2].slice(1)]);
                if (operators[2] == "undefined") operators[2] = "";
                console.log(`    + $op1:${operators[2]}`);
            }
            //console.log(operators);
            switch (operators[1]) {
                case "~":
                    to_replace_content = String(operators[0]).length > 0;
                    break;
                case "!~":
                    to_replace_content = String(operators[0]).length <= 0;
                    break;
                case "@=":
                    to_replace_content = String(operators[0]).toLowerCase() == String(operators[2]).toLowerCase();
                    break;
                case "!@=":
                    to_replace_content = String(operators[0]).toLowerCase() != String(operators[2]).toLowerCase();
                    break;
                case "#=":
                    to_replace_content = Number(operators[0]) == Number(operators[2]);
                    break;
                case "!#=":
                    to_replace_content = Number(operators[0]) != Number(operators[2]);
                    break;
                case "<":
                    to_replace_content = Number(operators[0]) < Number(operators[2]);
                    break;
                case "<=":
                    to_replace_content = Number(operators[0]) <= Number(operators[2]);
                    break;
                case ">":
                    to_replace_content = Number(operators[0]) > Number(operators[2]);
                    break;
                case ">=":
                    to_replace_content = Number(operators[0]) >= Number(operators[2]);
                    break;
                case "<>":
                    // this is an "includes" operator; the LHS is the haystack and the RHS is the needle
                    to_replace_content = String(operators[0]).toLowerCase().includes(String(operators[2]).toLowerCase());
                    break;
                case "!<>":
                    to_replace_content = String(operators[0]).toLowerCase().includes(String(operators[2]).toLowerCase()) == false;
                    break;
                case "<>;":
                    // this is a "matches keyterms" operator: if you have the LHS as "rogoza's room" and the RHS as "music;instrument;choir;rogoza", evaluateQuery will return true because one of the 
                    // RHS key terms, "rogoza" appears in the LHS, "rogoza's room".
                    // <>; is a way of saying "left hand side contains any of the right hand side keyterms?"
                    // This is the only one that does not have the opposite operator
                    var RHSkeyterms = String(operators[2]).toLowerCase().split(";");
                    var hits = 0;
                    for (let kt = 0; kt < RHSkeyterms.length; kt++) {
                        //console.log(RHSkeyterms[kt]);
                        if (operators[0].toLowerCase().includes(RHSkeyterms[kt])) hits++;
                    }
                    to_replace_content = hits > 0;
                    break;
                default:
                    console.error(`[${this.svg_id}][evaluateQuery] Bad operator: invalid check condition: ${content}, operators = ${operators}`);
                    return null;
                    break;
            }
            conditions_and_instructions[0] = conditions_and_instructions[0].replaceAll(content, to_replace_content);
            //console.log(to_replace_content);
            console.log(`    < ${conditions_and_instructions[0]}`);
            search_index = conditions_and_instructions[0].indexOf("{", search_index + 1); // this will tell JS to look past the current curly brace and see if there is another
        }
        // Now that we have something that resembles "true && false || true || false", we can parse that to make the ultimate determination as to whether or not the feature given is part of the layer
        conditions_and_instructions[0] = conditions_and_instructions[0].replaceAll(" ", "");
        if (conditions_and_instructions[0].replaceAll("false", "").replaceAll("true", "").replaceAll("||", "").replaceAll("&&", "").length > 0) {
            console.error(`    - [${this.svg_id}][evaluateQuery] Unable to simmer query down to valid boolean expression after parsing through replacements + match operators. Current exp = "${conditions_and_instructions[0]}".`);
            return null;
        }
        var broken_up_by_and_operator = conditions_and_instructions[0].split("&&");
        console.log(`    ! ${broken_up_by_and_operator}`)
        for (let i = 0; i < broken_up_by_and_operator.length; i += 1) {
            if (broken_up_by_and_operator[i].includes("true") == false) {
                // in this case, the feature did NOT pass the layer membership check
                // return false so that the caller knows that the query was successful but just didn't come up with a true for a final answer
                console.log(`  + [${this.svg_id}][evaluateQuery] Check failed for ${feature.landmark_id}.`);
                return [false, conditions_and_instructions[0]];
            }
        }
        // if we get to this part of the program, it means that this feature did meet all the layer conditions and that the second half of the query (the instructions)
        // will be executed
        console.log(`  + [${this.svg_id}][evaluateQuery] Check passed for ${feature.landmark_id}!`);
        return [true, conditions_and_instructions[0]];
    }




}