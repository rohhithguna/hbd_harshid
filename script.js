// Initialize Lenis smooth scroll
const lenis = new Lenis({
  duration: 1.5,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
  infinite: false,
})

// Sync GSAP with Lenis
let scrollTimeout;
lenis.on('scroll', (e) => {
    ScrollTrigger.update();
    const nav = document.querySelector('.navbar');
    if (nav) {
        nav.classList.add('scrolling');
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            nav.classList.remove('scrolling');
        }, 150);
    }
});

gsap.ticker.add((time)=>{
  lenis.raf(time * 1000)
})

gsap.ticker.lagSmoothing(0)

// Stop smooth scrolling initially
lenis.stop();

// Wait for load to start cinematic intro sequence
window.addEventListener('load', () => {
    // Reveal the car faintly
    gsap.to('.intro-car-wrapper', {
        opacity: 0.15,
        duration: 3,
        ease: 'power2.inOut'
    });
});

/* =========================================
   CINEMATIC AUDIO CONTROLLER 
   ========================================= */
class CinematicAudio {
    constructor() {
        this.tracks = {
            ignition: document.getElementById('sfx-ignition'),
            idle: document.getElementById('sfx-idle'),
            ambience: document.getElementById('sfx-ambience'),
            transition: document.getElementById('sfx-transition'),
            rev: document.getElementById('sfx-rev')
        };
        
        // Set initial hard-coded constraints
        this.tracks.idle.volume = 0;
        this.tracks.ambience.volume = 0;
        this.tracks.transition.volume = 0.7; // Audible transition whoosh
        this.tracks.rev.volume = 0;
        
        this.initialized = false;
        this.ambienceStarted = false;
    }

    // 1. Mobile browser Autoplay Unlock (Must run on first exact click)
    initContext() {
        if(this.initialized) return;
        
        // Playing and instantly pausing tricks the browser into unlocking the Web Audio API context
        Object.entries(this.tracks).forEach(([name, track]) => {
            if (name === 'ignition') return; // Skip ignition since we actually want to hear it right now
            
            let playPromise = track.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    track.pause();
                    track.currentTime = 0;
                }).catch(err => console.warn("Audio unlock prevented: ", err));
            }
        });
        this.initialized = true;
    }

    // Smooth GSAP based volume fader
    fadeAudio(track, targetVolume, durationSec) {
        if(track.paused) {
            track.volume = 0;
            track.play().catch(e => console.warn("Play interrupted", e));
        }
        gsap.to(track, {
            volume: targetVolume,
            duration: durationSec,
            ease: "power1.inOut"
        });
    }

    playIgnition() {
        this.tracks.ignition.volume = 1.0;
        this.tracks.ignition.play().catch(e => console.warn("AutoPlay blocked", e));
        
        // Smoothly fade in idle a few seconds after the ignition hits
        gsap.delayedCall(2, () => {
            this.fadeAudio(this.tracks.idle, 0.6, 3);
        });
    }

    startNightDriveAmbience() {
        if(this.ambienceStarted) return;
        this.ambienceStarted = true;
        // Slow cinematic swell of night wind / empty road ambience
        this.fadeAudio(this.tracks.ambience, 0.5, 5);
    }

    playSectionTransition() {
        this.tracks.transition.currentTime = 0;
        this.tracks.transition.play().catch(() => {});
    }

    playCinematicRev() {
        this.tracks.rev.currentTime = 0;
        this.fadeAudio(this.tracks.rev, 0.9, 0.5); // Fast rev up — LOUD
        
        // Fade the rev back down into idle shortly after peaking
        gsap.delayedCall(1.5, () => {
            gsap.to(this.tracks.rev, { volume: 0, duration: 1.5 });
        });
    }

    fadeOutAll() {
        Object.values(this.tracks).forEach(track => {
            gsap.to(track, {
                volume: 0,
                duration: 5, // Extremely slow, dramatic fade out
                ease: "power2.out",
                onComplete: () => {
                    track.pause();
                }
            });
        });
    }
}

const audioSystem = new CinematicAudio();

// Start Engine Button Flow
document.querySelector('.engine-start-btn').addEventListener('click', () => {
    // Disable button to prevent double clicks
    document.querySelector('.engine-start-btn').style.pointerEvents = 'none';
    
    // Unlock and trigger initial audio
    audioSystem.initContext();
    audioSystem.playIgnition();

    const tl = gsap.timeline();

    // 1. Fade out the start button
    tl.to('.engine-start-btn', {
        opacity: 0,
        scale: 0.8,
        duration: 0.5,
        ease: "power2.inOut"
    });

    // 2. BMW Image dramatically powers up (Brightens like headlights flicking on)
    tl.to('.intro-drl', {
        filter: "brightness(1.5) contrast(1.1)", // Overdrive the headlights brightness
        duration: 0.8,
        ease: "power2.out"
    }, "+=0.2")

    // The violent engine start shake applied to image wrapper
    .to('.intro-car-wrapper', {
        y: "+=3px",
        x: "-=2px",
        duration: 0.05,
        yoyo: true,
        repeat: 8
    }, "-=0.8")
    
    // 3. Fog intensifies as headlights pierce
    .to(['.intro-fog'], {
        opacity: 1,
        duration: 2.0,
        ease: "power2.out"
    }, "-=0.2")

    // 4. Advertising Dolly Zoom: Camera pushes low and tight into the car
    .to('.intro-car-wrapper', {
        scale: 1.4,
        y: 60, // Lowering camera angle heavily offsets the car upwards
        duration: 4,
        ease: "power2.inOut"
    }, "-=2.0")
    
    // Intro Text Fades In
    .to('.line-1', {
        opacity: 1,
        y: 0,
        duration: 2,
        ease: "power2.out"
    }, "-=3")

    // 5. Fade out intro overlay to reveal hero scene!
    .to('.intro-overlay', {
        backgroundColor: "rgba(0,0,0,0)",
        opacity: 0,
        duration: 2.5,
        ease: "power2.inOut",
        onComplete: () => {
            document.querySelector('.intro-overlay').style.display = 'none';
            lenis.start();
            initHeroAnimation();
        }
    }, "+=1");
});

function initHeroAnimation() {
    const tl = gsap.timeline();
    
    // Animate hero image
    gsap.to('#hero-img', {
        scale: 1,
        opacity: 0.8,
        duration: 3,
        ease: 'power3.out'
    });

    // Reveal text
    tl.to('.hero-title', {
        opacity: 1,
        y: 0,
        duration: 1.5,
        ease: 'power3.out'
    }, 0.5)
    .to('.hero-subtitle', {
        opacity: 1,
        y: 0,
        duration: 1.5,
        ease: 'power3.out'
    }, 0.8)
    .fromTo('.scroll-indicator', {
        opacity: 0
    }, {
        opacity: 0.7,
        duration: 1.5,
        ease: 'power2.inOut'
    }, 1.5)
    .to('.navbar', {
        opacity: 1,
        duration: 1.5,
        ease: 'power2.inOut'
    }, 1.5);

    initScrollAnimations();
}

function initScrollAnimations() {
    // Navigation Toggles
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            lenis.scrollTo(targetId, { duration: 2, offset: -80, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
        });
    });

    // Active state sync with scroll
    ScrollTrigger.create({
        trigger: '#birthday-climax',
        start: 'top center',
        onEnter: () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            const bBtn = document.querySelector('.nav-btn[data-target="#birthday-climax"]');
            if(bBtn) bBtn.classList.add('active');
        },
        onLeaveBack: () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            const sBtn = document.querySelector('.nav-btn[data-target="#story-intro"]');
            if(sBtn) sBtn.classList.add('active');
        }
    });

    // Chapter Animations
    const chapters = gsap.utils.toArray('.chapter');
    
    chapters.forEach((chapter, i) => {
        const img = chapter.querySelector('.bg-img');
        const h2 = chapter.querySelector('h2');
        const p = chapter.querySelector('p');
        
        // Parallax image wrapper effect
        gsap.fromTo(img, 
            { yPercent: -10, scale: 1.05 },
            {
                yPercent: 10,
                scale: 1,
                ease: "none",
                scrollTrigger: {
                    trigger: chapter,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true
                }
            }
        );

        // Dark overlay fading as we scroll
        gsap.to(img, {
            opacity: 0.9,
            ease: "none",
            scrollTrigger: {
                trigger: chapter,
                start: "top 70%",
                end: "center center",
                scrub: true
            }
        });

        // Text reveal stagger
        const textElements = chapter.querySelectorAll('.text-block > *');
        
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: chapter,
                start: "top 60%",
                toggleActions: "play reverse play reverse"
            }
        });

        tl.fromTo(textElements, 
            { opacity: 0, y: 30 },
            {
                opacity: 1,
                y: 0,
                duration: 1.2,
                stagger: 0.4,
                ease: "power3.out"
            }
        );
        
        // Hook audio into Chapter scroll triggers
        ScrollTrigger.create({
            trigger: chapter,
            start: "top 60%",
            onEnter: () => {
                audioSystem.playSectionTransition();
                audioSystem.startNightDriveAmbience(); // Triggers once on first story scroll
            },
            onEnterBack: () => audioSystem.playSectionTransition() // Play transition when scrolling upwards too
        });
    });

    // Birthday Reveal Timeline
    const bdayTl = gsap.timeline({
        scrollTrigger: {
            trigger: '#birthday-climax',
            start: "top 60%", // Triggers nicely when entering
            toggleActions: "play none none reverse"
        }
    });

    bdayTl.to('.date-main', { opacity: 1, y: 0, duration: 1.5, ease: "power2.out" })
          .to('.date-sub', { opacity: 1, y: 0, duration: 1.5, ease: "power2.out" }, "-=1")
          .to('.bday-line', {
              opacity: 1,
              y: 0,
              duration: 2,
              stagger: 1.5, // Total reveal will take around 10+ seconds
              ease: "power2.out"
          }, "-=0.5");

    // Prep Final Scene Rev effect slightly before the scene physically enters
    ScrollTrigger.create({
        trigger: '.final-scene',
        start: "top 120%", 
        onEnter: () => audioSystem.playCinematicRev()
    });

    // Final BMW Scene Animation
    const outroTl = gsap.timeline({
        scrollTrigger: {
            trigger: '.final-scene',
            start: "top 60%", // Triggers when user enters final cinematic shot
            toggleActions: "play none none reverse"
        }
    });

    // 1. Car silhouette slightly scales up and fades in
    outroTl.to('.car-wrapper', {
        opacity: 1,
        scale: 1, // Full scale pushes "forward" effect
        y: 0,
        duration: 4,
        ease: "power2.out"
    })
    
    // 2. Image powers up via brightness filter mimicking DRLs illuminating
    .to('.final-drl', {
        filter: "brightness(1) contrast(1.2)", 
        duration: 2.5,
        ease: "power2.inOut"
    }, "-=2")

    // 4. Text fades into place linearly
    .to('.tier-1', {
        opacity: 1,
        y: 0,
        duration: 2,
        ease: "power2.out"
    }, "-=0.5")
    
    .to('.tier-2', {
        opacity: 1,
        y: 0,
        duration: 2,
        ease: "power2.out",
        onStart: () => {
            // Initiate full theatrical sound fadeout when the "Happy Birthday" text starts appearing
            audioSystem.fadeOutAll(); 
        }
    }, "+=0.5")
    
    .to('.tier-3', {
        opacity: 1,
        y: 0,
        duration: 2.5,
        ease: "power2.out"
    }, "+=1");
}
