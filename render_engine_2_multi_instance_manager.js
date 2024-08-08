class PVMapGroup {
	
	constructor(default_map = null) {
		this.pvmaps = {};
		this.activeMap = null;
	}
	
	addPVMap(pvmap) {
		// 1. Store a reference to the map 
		this.pvmaps[pvmap.svg_id] = {
			map_dataset_object: pvmap,
			dragX: 0,
			dragY: 0,
			zoom: 0,
			search_results: []
		}
		
		// 2. If it's the first map that was loaded, make it the active map; otherwise stow it away
		if (Object.keys(this.pvmaps).length == 1) this.makeActive(pvmap.svg_id);
		else this.stowAway(pvmap.svg_id);
		
		
		
		return null;
	}
	
	stowAway(map_id, x = 0, y = 0, zm = 0) {
		// 1. Store the zoom and xy data so it can be recalled later
		this.pvmaps[map_id].dragX = x;
		this.pvmaps[map_id].dragY = y;
		this.pvmaps[map_id].zoom = zm;
		
		// 2. Hide this map's checkbox elements
		var checkboxes = document.querySelectorAll("input[type=checkbox][id*=first_floor__]");
		for (let i = 0; i < checkboxes.length; i += 1) {
			checkboxes[i].style.display = "none";
		}
		var checkboxes = document.querySelectorAll("label[for*=first_floor__]");
		for (let i = 0; i < checkboxes.length; i += 1) {
			checkboxes[i].style.display = "none";
		}
		var checkboxes = document.querySelectorAll("button[id*=first_floor__]");
		for (let i = 0; i < checkboxes.length; i += 1) {
			checkboxes[i].style.display = "none";
		}
		
		// 3. Hide this map's SVG element
		this.pvmaps[map_id].map_dataset_object.svg_container.style.display = "none";
		
		// 4. Change this.activeMap pointer
		this.activeMap = null;
		
		return null;
	}
	
	makeActive(map_id) {
		// 0. Check to make sure that two maps aren't active at the same time
		if (this.activeMap) {
			console.error(`[PVMapGroup] A map is already marked as active: ${this.activeMap.map_dataset_object.svg_id}. Deactivate that map before activating another.`);
			return null;
		}
		
		// 1. Show the checkboxes
		var checkboxes = document.querySelectorAll("input[type=checkbox][id*=first_floor__]");
		for (let i = 0; i < checkboxes.length; i += 1) {
			checkboxes[i].style.display = "";
		}
		var checkboxes = document.querySelectorAll("label[for*=first_floor__]");
		for (let i = 0; i < checkboxes.length; i += 1) {
			checkboxes[i].style.display = "";
		}
		var checkboxes = document.querySelectorAll("button[id*=first_floor__]");
		for (let i = 0; i < checkboxes.length; i += 1) {
			checkboxes[i].style.display = "";
		}
		
		// 2. Show the map
		this.pvmaps[map_id].map_dataset_object.svg_container.style.display = "";
		
		// 3. Change this.activeMap ptr
		this.activeMap = this.pvmaps[map_id];
		
		// 4. Give the caller the x, y and zoom that the end user left that map on, in case the caller wants to restore the user's old zoom/pos
		return [this.pvmaps[map_id].dragX, this.pvmaps[map_id].dragY, this.pvmaps[map_id].zoom];
	}
	
	searchAllMaps(search_term) {
		var all_results_count = 0;
		var ret = {};
		var keys = Object.keys(this.pvmaps);
		for (let i = 0; i < keys.length; i += 1) {
			this.pvmaps[keys[i]].search_results = this.pvmaps[keys[i]].map_dataset_object.searchForInThisMap(search_term);
			all_results_count += this.pvmaps[keys[i]].search_results.length;
			ret[keys[i]] = structuredClone(this.pvmaps[keys[i]].search_results);
		}
		ret.total_results = all_results_count;
		return ret;		
	}	
}