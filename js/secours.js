// La page reste cachée jusqu'à la classe « decor-pret », posée par
// js/decor.js. Si le décor ne démarre pas, la classe est posée au bout de 3 s.
// Fichier séparé car la CSP de _headers interdit les scripts inline.
setTimeout(function () { document.documentElement.classList.add("decor-pret"); }, 3000);
