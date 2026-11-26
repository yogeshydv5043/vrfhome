/* Gallery page: photo and video grid.
   Renders items from MEDIA_ITEMS in js/media-data.js, filters by kind, keeps
   the result count in step and opens the full-screen viewer. Shows the owner
   guidance panel while no media has been added.
   Static and local: no uploads, no analytics, no autoplay. */
(() => {
  "use strict";
  const grid = document.getElementById("media-grid");
  const dialog = document.getElementById("media-viewer");
  if (!grid || !dialog) return;
  const root = new URL(document.baseURI);
  const extensions = {photo:/\.(?:jpe?g|png|webp|avif)$/i,video:/\.(?:mp4|webm)$/i,captions:/\.vtt$/i};
  // Resolves a media path against the site root.
  function asset(value,kind) {
    if (typeof value !== "string" || !/^media\/gallery\/(?:photos|videos|posters|captions)\/[a-zA-Z0-9_ /.-]+$/.test(value) || value.split('/').some(p=>p==='..'||p==='.') || !extensions[kind].test(value)) return null;
    const url = new URL(value,root);
    return url.pathname.startsWith(root.pathname+"media/") ? url.href : null;
  }
  // Trims a value, tolerating a missing one.
  const text = value => typeof value === "string" ? value.trim() : "";
  const ids = new Set();
  const items = (typeof GALLERY_MEDIA !== "undefined" && Array.isArray(GALLERY_MEDIA) ? GALLERY_MEDIA : []).flatMap((item,index) => {
    if (!item || !["photo","video"].includes(item.type)) { console.warn("Gallery entry skipped:",index); return []; }
    const src = asset(item.src,item.type), id = text(item.id), title = text(item.title), alt = text(item.alt);
    if (!src || !id || !title || ids.has(id) || (item.type === "photo" && !alt)) { console.warn("Invalid or duplicate gallery entry skipped:",index); return []; }
    ids.add(id);
    return [{id,type:item.type,reference:item.reference === true,title,src,alt,caption:text(item.caption),poster:asset(item.poster,"photo"),captions:asset(item.captions,"captions"),captionLanguage:/^[a-z]{2,3}(?:-[A-Za-z0-9]+)*$/.test(item.captionLanguage||"")?item.captionLanguage:"en",captionLabel:text(item.captionLabel)||"Captions",transcript:text(item.transcript)}];
  });
  let shown = items.slice(), active = 0, opener = null;
  const empty = document.getElementById("media-empty");
  const stage = document.getElementById("media-stage");
  const error = document.getElementById("media-error");
  const prev = dialog.querySelector("[data-media-prev]");
  const next = dialog.querySelector("[data-media-next]");
  // Small helper for building an element with a class and contents.
  function node(tag,className,content) {
    const el = document.createElement(tag);
    if (className) el.className=className;
    if (content !== undefined) el.textContent=content;
    return el;
  }
  // Stops and unloads the playing video when the viewer closes.
  function release() {
    const video = stage.querySelector("video");
    if (video) { video.pause(); video.removeAttribute("src"); video.load(); }
    stage.replaceChildren();
  }
  // Draws the current item in the viewer and updates its caption.
  function renderMedia() {
    release();
    const item = shown[active];
    if (!item) return;
    error.hidden=true;
    error.textContent="";
    document.getElementById("media-position").textContent=`${String(active+1).padStart(2,"0")} / ${String(shown.length).padStart(2,"0")} · ${item.type === "photo" ? "PHOTO" : "VIDEO"}`;
    document.getElementById("media-viewer-title").textContent=item.title;
    document.getElementById("media-viewer-description").textContent=item.caption;
    const transcript = document.getElementById("media-transcript");
    transcript.hidden=item.type!=="video"||!item.transcript;
    transcript.open=false;
    transcript.querySelector("p").textContent=item.transcript;
    prev.disabled=next.disabled=shown.length<2;
    const media = document.createElement(item.type==="photo"?"img":"video");
    if (item.type==="photo") { media.alt=item.alt; media.draggable=false; media.decoding="async"; }
    else {
      media.controls=true; media.playsInline=true; media.preload="none";
      /* Muted on open. Seven of the eight studio walkthroughs carry only room
         tone, and one is loud enough to startle someone browsing at a desk,
         so none of them starts with sound. defaultMuted sets the attribute as
         well as the property, which is what survives the element being
         re-created for the next item. The volume control is hidden in
         css/media-gallery.css. */
      media.muted=true; media.defaultMuted=true;
      media.setAttribute("aria-label",item.title);
      media.setAttribute("controlsList","nodownload noremoteplayback");
      if (item.poster) media.poster=item.poster;
      if (item.captions) {
        const track=document.createElement("track");
        track.kind="captions"; track.src=item.captions; track.srclang=item.captionLanguage; track.label=item.captionLabel; track.default=true;
        track.addEventListener("error",()=>{ if(stage.contains(media)) { error.textContent="Captions could not be loaded. Use the transcript below if available."; error.hidden=false; } });
        media.append(track);
      }
      media.append(document.createTextNode("Your browser cannot play this video format."));
    }
    media.addEventListener("error",()=>{
      if (!stage.contains(media)) return;
      error.textContent=`This ${item.type === "photo" ? "photo" : "video"} could not be loaded. Please try another item or return later.`;
      error.hidden=false;
    });
    stage.append(media);
    media.src=item.src;
  }
  // Opens the viewer on an item and remembers what to focus on close.
  function open(index,button) {
    opener=button; active=index;
    renderMedia(); dialog.showModal(); Studio.lockScroll();
    dialog.querySelector("[data-media-close]").focus();
  }
  // Steps to the previous or next item, wrapping at either end.
  function move(delta) {
    if (shown.length<2) return;
    active=(active+delta+shown.length)%shown.length;
    renderMedia();
  }
  /* Works out the small copy of a photograph or poster that belongs in a grid
     card. A card is never wider than about 390px, so sending it the same
     1448px file the lightbox uses wastes most of the download. The small
     copies live in media/gallery/thumbs/ and are named after their source,
     e.g. photos/modern-bathroom-dark.webp -> thumbs/modern-bathroom-dark-480.webp.

     Note that asset() above returns an absolute URL, not the relative path
     written in media-data.js, so this matches on the path segment and keeps
     whatever origin the page is served from.

     Returns "" for anything that does not match, and the card then just uses
     the original file. Nothing here can break a card: if a thumbnail is
     missing the error handler in card() falls back to the original too. */
  const THUMB_SOURCE=/\/media\/gallery\/(?:photos|posters)\/[^/]+\.webp$/;
  function thumbFor(source,width) {
    if (typeof source !== "string" || !THUMB_SOURCE.test(source)) return "";
    return source.replace(/\/media\/gallery\/(?:photos|posters)\//,"/media/gallery/thumbs/")
                 .replace(/\.webp$/,`-${width}.webp`);
  }

  // Builds one grid card with its thumbnail, kind badge and caption.
  function card(item,index) {
    const article=node("article","media-card");
    const button=node("button","media-open"); button.type="button";
    button.setAttribute("aria-label",`${item.type === "photo" ? "View photo" : "Play video"}: ${item.title}`);
    const visual=node("span","media-thumbnail");
    const source=item.type==="photo"?item.src:item.poster;
    if (source) {
      const image=node("img"); image.alt=""; image.loading="lazy"; image.decoding="async"; image.draggable=false; image.width=800; image.height=600;
      const small=thumbFor(source,480), large=thumbFor(source,960);
      if (small) {
        /* Let the browser pick. sizes describes how wide a card actually is:
           the grid is one column on a phone, two on a tablet and three on a
           desktop, matching the breakpoints in css/media-gallery.css. */
        image.src=small;
        image.srcset=`${small} 480w, ${large} 960w`;
        image.sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw";
      } else image.src=source;
      image.addEventListener("error",()=>{
        /* First failure with a thumbnail in play means the small copy is
           missing - most likely a photograph was added without generating
           one. Drop back to the full-size original rather than showing a
           hole, and let a second failure fall through to the notice. */
        if (small && image.dataset.usedOriginal!=="1") {
          image.dataset.usedOriginal="1";
          image.removeAttribute("srcset"); image.removeAttribute("sizes");
          image.src=source;
          return;
        }
        image.remove();
        if(item.type==="photo") visual.append(node("span","media-thumbnail-note","Preview unavailable"));
      });
      visual.append(image);
    }
    if(item.type==="video") { const play=node("span","media-play","▷"); play.setAttribute("aria-hidden","true"); visual.append(play); }
    visual.append(node("span","media-kind",(item.type === "photo" ? "Photo" : "Video") + (item.reference ? " · Reference" : "")));
    const meta=node("span","media-meta");
    meta.append(node("span","media-title",item.title));
    const arrow=node("span","","↗"); arrow.setAttribute("aria-hidden","true"); meta.append(arrow);
    button.append(visual,meta); button.addEventListener("click",()=>open(index,button));
    article.append(button); return article;
  }
  // Filters by photo or video and updates the count and pressed state.
  function filter(type) {
    shown=items.filter(item=>type==="all"||item.type===type);
    grid.replaceChildren(...shown.map(card));
    document.querySelectorAll("[data-media-filter]").forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.mediaFilter===type)));
    document.getElementById("media-status").textContent=`${shown.length} ${type === "all" ? (shown.length === 1 ? "item" : "items") : (type === "photo" ? (shown.length === 1 ? "photo" : "photos") : (shown.length === 1 ? "video" : "videos"))}`;
    empty.hidden=shown.length>0;
    document.getElementById("media-empty-title").textContent=items.length?"Nothing in this view yet.":type==="photo"?"Photographs, coming soon.":type==="video"?"Videos, coming soon.":"New perspectives, coming soon.";
    document.getElementById("media-empty-copy").textContent=items.length?"Try another filter to explore the rest of the gallery.":"Photos and videos will appear here as they are added. In the meantime, explore the project collection.";
  }
  const referenceNote = document.querySelector(".media-reference-note");
  if (referenceNote) referenceNote.hidden = !items.some(item => item.reference);
  document.querySelector(".media-filters").hidden=false;
  document.querySelectorAll("[data-media-count]").forEach(el=>el.textContent=String(items.filter(item=>el.dataset.mediaCount==="all"||item.type===el.dataset.mediaCount).length));
  document.querySelectorAll("[data-media-filter]").forEach(button=>button.addEventListener("click",()=>filter(button.dataset.mediaFilter)));
  prev.addEventListener("click",()=>move(-1)); next.addEventListener("click",()=>move(1));
  dialog.querySelector("[data-media-close]").addEventListener("click",()=>dialog.close());
  dialog.addEventListener("cancel",event=>{event.preventDefault();dialog.close();});
  dialog.addEventListener("close",()=>{release();Studio.lockScroll();if(opener?.isConnected)opener.focus({preventScroll:true});});
  dialog.addEventListener("click",event=>{
    const r=dialog.getBoundingClientRect();
    if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close();
  });
  dialog.addEventListener("keydown",event=>{
    if (event.target.closest("video,input,textarea,summary") || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key==="ArrowRight"||event.key==="ArrowLeft") {event.preventDefault();move(event.key==="ArrowRight"?1:-1);}
  });
  let start=null;
  stage.addEventListener("touchstart",event=>{ start=event.touches.length !== 1 || event.target.closest("video") ? null : {x:event.changedTouches[0].clientX,y:event.changedTouches[0].clientY}; },{passive:true});
  stage.addEventListener("touchend",event=>{
    if(!start)return;
    const dx=event.changedTouches[0].clientX-start.x,dy=event.changedTouches[0].clientY-start.y;
    if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.3)move(dx<0?1:-1);
    start=null;
  },{passive:true});
  window.addEventListener("pagehide",()=>stage.querySelector("video")?.pause());
  filter("all");
})();
