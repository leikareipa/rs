/*
 * 2022 Tarpeeksi Hyvae Soft
 *
 * Software: rs
 * 
 */

import mutations from "./mutations.js";

console.assert = function(condition, errorMessage = "") {
    if (!condition) {
        throw new Error(errorMessage);
    }
}

const controlPanelEl = document.querySelector("#control-panel");
const controlPanelCloserEl = document.querySelector("#control-panel-closer");
const aboutEl = controlPanelEl.querySelector("#about");
const dismissAboutEl = aboutEl.querySelector(".close.button");
const mutationContainerEl = controlPanelEl.querySelector("#mutation-container");
const selectionCountEl = controlPanelEl.querySelector("#mutation-selection-count-indicator");
const searchEl = controlPanelEl.querySelector("#search");
const frameEl = document.querySelector("#rs-iframe");
console.assert(
    controlPanelEl &&
    controlPanelCloserEl &&
    dismissAboutEl &&
    mutationContainerEl &&
    selectionCountEl &&
    searchEl &&
    frameEl
);

// Build the UI's list of available mutations.
for (const [title, mutation] of Object.entries(mutations).sort()) {
    console.assert(
        (typeof mutation === "object") &&
        (typeof mutation.id === "string") &&
        (typeof mutation.author === "string") &&
        Array.isArray(mutation.payload)
    );

    const checkboxEl = document.createElement("input");
    checkboxEl.setAttribute("type", "checkbox");
    checkboxEl.setAttribute("value", mutation.payload.map(element=>`'${element}'`).join(","));
    checkboxEl.onchange = on_mutation_selection_changed;
    checkboxEl.dataset.mutationId = mutation.id;

    const labelEl = document.createElement("label");
    labelEl.setAttribute("class", "mutation");
    labelEl.setAttribute("title", mutation.tooltip || "");
    labelEl.append(checkboxEl, document.createTextNode(title));

    mutationContainerEl.append(labelEl);
}

// Initialize the UI state.
{
    searchEl.oninput = (event)=>update_mutation_search(event.target.value);
    controlPanelCloserEl.onclick = toggle_control_panel_expansion;
    dismissAboutEl.onclick = hide_about_element;

    update_mutation_selection_count_label(0);

    if (!localStorage.getItem("rs:hide-about")) {
        aboutEl.classList.remove("hidden");
    }

    // Effect the user's desired selection of mutations, either via a URL parameter or from
    // persistent local storage, if either one is available.
    {
        const allMutationEls = Array.from(mutationContainerEl.querySelectorAll("input[type='checkbox']"));
        const urlParamData = new URLSearchParams(window.location.search).get("mutations");
        const persistentData = (localStorage.getItem("rs:mutation-selection") || "");

        console.log(persistentData)

        if (urlParamData !== null) {
            const mutationIds = urlParamData.split("$");
            allMutationEls.filter(el=>mutationIds.includes(el.dataset.mutationId)).forEach(el=>{el.checked = true; el.onchange()});
        }
        else if (persistentData.length) {
            const persistedIds = persistentData.split(",")
            allMutationEls.filter(el=>persistedIds.includes(el.dataset.mutationId)).forEach(el=>{el.checked = true; el.onchange()});
        }
        // Otherwise, load the default, unmodified game.
        else {
            frameEl.src = get_rs_dosbox_url();
        }
    }
}

// Gets called when a mutation's checkbox in the UI is toggled.
function on_mutation_selection_changed() {
    const selectedMutations = Array.from(mutationContainerEl.querySelectorAll("input[type='checkbox']:checked"));
    const selectedIdsList = selectedMutations.map(el=>el.dataset.mutationId);
    const selectedIdsString = selectedIdsList.join(",");
    const mutationRunCommands = selectedMutations.map(m=>m.value).join(",");

    debounced_update_rs_iframe_src(get_rs_dosbox_url(mutationRunCommands));
    update_mutation_selection_count_label(selectedMutations.length);
    
    localStorage[selectedIdsString.length? "setItem" : "removeItem"]("rs:mutation-selection", selectedIdsString);
    window.history.replaceState(null, null, (selectedIdsList.length? `?mutations=${selectedIdsList.join("$")}` : "/"));
}

// Returns a URL to a ths-web-dosbox (cf. github.com/leikareipa/ths-web-dosbox)
// client that provides our in-browser Rally-Sport experience, inserting into it the
// given run commands from rs.
function get_rs_dosbox_url(runCommands = "") {
    console.assert(typeof runCommands === "string");

    const thsDosboxBaseUrl = (window.location.hostname === "localhost")
        ? "http://localhost:8000/dosbox"
        : "https://www.tarpeeksihyvaesoft.com/dosbox";

    return `${thsDosboxBaseUrl}/?run=['del RALLYE.EXE','copy RALLYE.ORG RALLYE.EXE',${runCommands},'rally.bat']#/rally-sport/rs/`;
}

// Updates the 'src' attribute of the iframe in which we run Rally-Sport, debouncing
// it so that multiple calls to this function within a brief delay period results in
// the attribute being changed only once.
function debounced_update_rs_iframe_src(newUrl = "") {
    console.assert(typeof newUrl === "string");

    if (debounced_update_rs_iframe_src.debounce !== undefined) {
        clearTimeout(debounced_update_rs_iframe_src.debounce);
    }

    debounced_update_rs_iframe_src.debounce = setTimeout(()=>{
        frameEl.focus();
        frameEl.src = newUrl;
        debounced_update_rs_iframe_src.debounce = undefined;
    }, 500);
}

function update_mutation_search(query = "") {
    console.assert(typeof query === "string");

    query = query.trim().toLowerCase();
    
    const allMutationEls = Array.from(mutationContainerEl.querySelectorAll("input[type='checkbox']")).map(el=>el.parentElement);
    const matchingMutationEls = allMutationEls.filter(el=>el.textContent.toLowerCase().includes(query));

    allMutationEls.forEach(el=>el.style.display = "none");
    matchingMutationEls.forEach(el=>el.style.display = "block");
    mutationContainerEl.classList[matchingMutationEls.length? "remove" : "add"]("empty");
}

function update_mutation_selection_count_label(numMutationsSelected = 0) {
    console.assert(typeof numMutationsSelected === "number");
    selectionCountEl.textContent = `${numMutationsSelected}/${Object.keys(mutations).length} mutations selected`;
}

function toggle_control_panel_expansion() {
    controlPanelEl.classList.toggle("expanded");
    controlPanelCloserEl.classList.toggle("active");
    frameEl.focus();
}

function hide_about_element() {
    aboutEl.remove();
    localStorage.setItem("rs:hide-about", true);
}
