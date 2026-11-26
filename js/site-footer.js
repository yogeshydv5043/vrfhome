/* Shared Home/Reviews site footer component. Keep one canonical markup source. */
(() => {
  "use strict";
  const footerMarkup = `<footer class="site-footer">
<div class="footer-grid">
<div class="footer-brand">
<a aria-label="VRF HOME INTERIORS home" class="brand vrf-brand" href=""><img alt="" class="brand-logo" decoding="async" draggable="false" height="321" loading="lazy" src="media/brand/logo/vrf-logo-light.png" width="551"/><span class="brand-lockup"><strong class="brand-name" data-brand="">VRF HOME INTERIORS</strong></span></a>
<p>Considered spaces.<br/>Extraordinary everyday living.</p>
<div class="socials">
<a aria-label="VRF Home Interiors on Instagram" data-social="instagram" href="contact-us/#contact-details" title="VRF Home Interiors on Instagram"><img alt="" aria-hidden="true" class="icon social-brand-icon" decoding="async" draggable="false" height="22" loading="lazy" src="media/brand/social/instagram.svg?v=b60" width="22"/></a><a aria-label="VRF Home Interiors on Facebook" data-social="facebook" href="contact-us/#contact-details" title="VRF Home Interiors on Facebook"><img alt="" aria-hidden="true" class="icon social-brand-icon" decoding="async" draggable="false" height="22" loading="lazy" src="media/brand/social/facebook.svg?v=b60" width="22"/></a><a aria-label="VRF Home Interiors on YouTube" data-social="youtube" href="contact-us/#contact-details" title="VRF Home Interiors on YouTube"><img alt="" aria-hidden="true" class="icon social-brand-icon" decoding="async" draggable="false" height="22" loading="lazy" src="media/brand/social/youtube.svg?v=b60" width="22"/></a>
</div>
</div>
<div data-navigation-list=""><h3>Explore</h3><a aria-current="page" href="./">Home</a><a href="about/">About</a><a href="service/">Services</a><a href="projects/">Projects</a><a href="gallery/">Gallery</a><a href="contact-us/">Contact</a></div>
<div data-service-links="">
<h3>Our services</h3>
<a href="service/#residential">Residential Interior Design</a><a href="service/#commercial">Commercial Interior Design</a><a href="service/#kitchen">Modular Kitchen Design</a><a href="service/#living-room">Living Room Design</a><a href="service/#bedroom">Bedroom Design</a><a href="service/#office">Office Interior Design</a><a href="service/#space-planning">Space Planning</a><a href="service/#renovation">Renovation &amp; Styling</a>
</div>
<div class="footer-policies"><h3>Policies</h3><a href="privacy-policy/">Privacy Policy</a><a href="terms/">Terms &amp; Conditions</a><a href="disclaimer/">Disclaimer</a></div><div class="footer-contact">
<h3>Let’s talk</h3>
<div class="footer-detail-row" data-contact-kind="email"><svg aria-hidden="true" class="icon" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewbox="0 0 24 24"><rect height="14" rx="2" width="18" x="3" y="5"></rect><path d="m3 6 9 7 9-7"></path></svg><a data-email="" href="mailto:vrf.interiors@gmail.com">vrf.interiors@gmail.com</a></div><div class="footer-detail-row" data-contact-kind="phone"><svg aria-hidden="true" class="icon" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewbox="0 0 24 24"><path d="m5 3 4 4-2 3c1 3 4 6 7 7l3-2 4 4c-1 5-8 1-12-3S1 4 5 3Z"></path></svg><a data-phone="" href="tel:+919999088992">+91 99990 88992</a></div><div class="footer-detail-row" data-contact-kind="address"><svg aria-hidden="true" class="icon" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewbox="0 0 24 24"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"></path><circle cx="12" cy="10" r="2"></circle></svg><span data-address="">Shop No. 11, Sector 93 Road, near Baba Jotram Chowk, Hayatpur, Sector 93, Gurugram, Haryana, 122001, India</span></div><div class="footer-detail-row" data-contact-kind="hours"><svg aria-hidden="true" class="icon" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewbox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg><span data-hours="">Monday–Saturday: 10:00 AM – 7:00 PM · Sunday: Closed</span></div>
</div>
</div>
<div class="footer-bottom">
<p>
          © <span class="current-year">2026</span>
<span data-brand="">VRF HOME INTERIORS</span>. All rights reserved.
        </p>
<p class="designer-credit">Designed &amp; developed with care by <a class="site-credit-link" href="https://ritplpro.com/" rel="noopener noreferrer" target="_blank"><strong data-site-credit="">RITPLPRO</strong></a>.</p></div>
</footer>`;
  const template = document.createElement("template");
  template.innerHTML = footerMarkup;
  document.querySelectorAll("[data-site-footer]").forEach((mount) => {
    mount.replaceWith(template.content.cloneNode(true));
  });
})();
