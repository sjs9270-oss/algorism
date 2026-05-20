// app.js - Xlence Guide Interactive Controller

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const htmlElement = document.documentElement;
  const sidebar = document.getElementById('app-sidebar');
  const navItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');
  const currentTabNumber = document.getElementById('current-tab-number');
  const currentTabTitle = document.getElementById('current-tab-title');
  const progressBar = document.getElementById('progress-bar');
  const progressPercentText = document.getElementById('progress-percent');
  const desktopThemeToggle = document.getElementById('desktop-theme-toggle');
  const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const closeSidebarBtn = document.getElementById('close-sidebar-btn');
  const copyButtons = document.querySelectorAll('.copy-btn');
  const nextPageButtons = document.querySelectorAll('.next-page-btn');
  const prevPageButtons = document.querySelectorAll('.prev-page-btn');
  const toastContainer = document.getElementById('toast-container');
  const stepCheckboxes = document.querySelectorAll('.step-checkbox');

  // --- State Configuration ---
  const tabMetadata = {
    'tab-kyc': { num: 'STEP 01', title: '가입 및 KYC 인증 방법', prefix: 'kyc' },
    'tab-account': { num: 'STEP 02', title: '거래 계좌 생성 방법', prefix: 'acc' },
    'tab-deposit-bank': { num: 'STEP 03', title: '국내은행 입금 방법', prefix: 'dpb' },
    'tab-withdraw-bank': { num: 'STEP 04', title: '국내은행 출금 방법', prefix: 'wdb' },
    'tab-deposit-crypto': { num: 'STEP 05', title: '암호화폐 입출금 방법', prefix: 'cpt' },
    'tab-mt4': { num: 'STEP 06', title: 'MT4 사용 방법', prefix: 'mt4' }
  };

  // --- Initialize Theme ---
  const savedTheme = localStorage.getItem('theme') || 'light';
  htmlElement.setAttribute('data-theme', savedTheme);

  // --- Initialize Checked Steps from localStorage ---
  let checkedSteps = JSON.parse(localStorage.getItem('checked_steps')) || {};
  
  // Appply loaded states to DOM checkboxes
  stepCheckboxes.forEach(checkbox => {
    const id = checkbox.getAttribute('data-step-id');
    if (checkedSteps[id]) {
      checkbox.checked = true;
      // Find parent card and highlight it
      const stepCard = checkbox.closest('.step-card');
      if (stepCard) stepCard.classList.add('checked');
    }
  });

  // --- Helper Functions ---
  
  // Show visual Toast Notification
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Check/Success SVG Icon
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto-destroy toast
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // Calculate and update progress (Individual Tab + Global App)
  function updateProgress() {
    let totalChecked = 0;
    const tabCounts = { kyc: 0, acc: 0, dpb: 0, wdb: 0, cpt: 0, mt4: 0 };
    const tabTotals = { kyc: 9, acc: 4, dpb: 5, wdb: 3, cpt: 6, mt4: 6 };
    const totalSteps = Object.values(tabTotals).reduce((a, b) => a + b, 0);

    // Count checked states
    stepCheckboxes.forEach(checkbox => {
      const id = checkbox.getAttribute('data-step-id');
      const prefix = id.split('-')[0];
      if (checkbox.checked) {
        totalChecked++;
        tabCounts[prefix]++;
      }
    });

    // Update global progress header
    const globalPercent = Math.round((totalChecked / totalSteps) * 100);
    progressBar.style.width = `${globalPercent}%`;
    progressPercentText.textContent = `${globalPercent}%`;

    // Update individual tab circle progress indicators
    Object.keys(tabTotals).forEach(key => {
      const checked = tabCounts[key];
      const total = tabTotals[key];
      const percent = Math.round((checked / total) * 100);

      // DOM target elements
      const fillEl = document.getElementById(`${key}-gauge-fill`);
      const textEl = document.getElementById(`${key}-gauge-percent`);
      const countEl = document.getElementById(`${key}-checked-count`);
      const navItem = document.querySelector(`.nav-item[data-tab="tab-${key === 'kyc' ? 'kyc' : (key === 'acc' ? 'account' : (key === 'dpb' ? 'deposit-bank' : (key === 'wdb' ? 'withdraw-bank' : (key === 'cpt' ? 'deposit-crypto' : 'mt4'))))}`);

      // Update circular dash offset (Circumference is 100)
      if (fillEl) {
        fillEl.setAttribute('stroke-dasharray', `${percent}, 100`);
      }
      if (textEl) {
        textEl.textContent = `${percent}%`;
      }
      if (countEl) {
        countEl.textContent = checked;
      }

      // Mark tab navigation bar as fully completed
      if (navItem) {
        if (checked === total) {
          navItem.classList.add('completed');
        } else {
          navItem.classList.remove('completed');
        }
      }
    });
  }

  // Handle Tab Switch Mechanism
  function switchTab(tabId) {
    // 1. Update navigation items
    navItems.forEach(item => {
      if (item.getAttribute('data-tab') === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // 2. Display content block
    tabContents.forEach(content => {
      if (content.id === tabId) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });

    // 3. Update header titles
    const meta = tabMetadata[tabId];
    if (meta) {
      currentTabNumber.textContent = meta.num;
      currentTabTitle.textContent = meta.title;
    }

    // 4. Scroll main body back to top
    document.querySelector('.content-body').scrollTop = 0;

    // 5. Save active tab selection in hash (optional SPA support)
    window.location.hash = tabId;

    // 6. Close sidebar on mobile drawer view
    sidebar.classList.remove('open');
  }

  // --- Event Listeners ---

  // Checkbox interactions
  stepCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const id = e.target.getAttribute('data-step-id');
      const stepCard = e.target.closest('.step-card');
      
      // Update local storage object
      if (e.target.checked) {
        checkedSteps[id] = true;
        if (stepCard) stepCard.classList.add('checked');
        showToast('단계를 완료 항목으로 표시했습니다.');
      } else {
        delete checkedSteps[id];
        if (stepCard) stepCard.classList.remove('checked');
      }
      
      localStorage.setItem('checked_steps', JSON.stringify(checkedSteps));
      updateProgress();
    });
  });

  // Sidebar navigation clicks
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = item.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Next Page Action Buttons inside guide flow
  nextPageButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-next-tab');
      switchTab(targetTab);
    });
  });

  // Previous Page Action Buttons
  prevPageButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-next-tab');
      switchTab(targetTab);
    });
  });

  // Copy to clipboard helper functionality
  copyButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetSelector = button.getAttribute('data-clipboard-target');
      const targetInput = document.querySelector(targetSelector);
      
      if (targetInput) {
        // Run standard clipboard copy
        navigator.clipboard.writeText(targetInput.value)
          .then(() => {
            showToast('클립보드에 주소가 정상 복사되었습니다.');
          })
          .catch(err => {
            showToast('복사에 실패했습니다. 직접 복사해 주세요.', 'error');
            console.error('Copy failure: ', err);
          });
      }
    });
  });

  // Theme Toggler functionality (Desktop and Mobile)
  function toggleTheme() {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    showToast(newTheme === 'dark' ? '다크 모드로 전환되었습니다.' : '라이트 모드로 전환되었습니다.');
  }

  desktopThemeToggle.addEventListener('click', toggleTheme);
  mobileThemeToggle.addEventListener('click', toggleTheme);

  // Mobile Menu Navigation drawer toggles
  mobileMenuToggle.addEventListener('click', () => {
    sidebar.classList.add('open');
  });

  closeSidebarBtn.addEventListener('click', () => {
    sidebar.classList.remove('open');
  });

  // --- Initial URL Hash routing load ---
  const initialHash = window.location.hash.substring(1);
  if (initialHash && tabMetadata[initialHash]) {
    switchTab(initialHash);
  } else {
    // Default load first KYC tab
    switchTab('tab-kyc');
  }

  // --- Refresh / trigger gauges calculation ---
  updateProgress();

  // --- Scrollspy functionality (Highlight Table of Contents link while reading) ---
  const contentBody = document.querySelector('.content-body');
  
  contentBody.addEventListener('scroll', () => {
    const activeTab = document.querySelector('.tab-content.active');
    if (!activeTab) return;

    const steps = activeTab.querySelectorAll('.step-card');
    const tocLinks = activeTab.querySelectorAll('.toc-link');
    
    let activeId = '';
    
    steps.forEach(step => {
      const rect = step.getBoundingClientRect();
      // If the top of the step card is in the top half of the screen
      if (rect.top < window.innerHeight / 2) {
        activeId = step.id;
      }
    });

    if (activeId) {
      tocLinks.forEach(link => {
        if (link.getAttribute('href') === `#${activeId}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
  });

  // Add click scrolling offset to TOC links
  document.querySelectorAll('.toc-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  // --- Lightbox Modal Feature ---
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');

  if (lightboxModal && lightboxImg && lightboxClose) {
    // Add click listeners to all zoomable images
    document.body.addEventListener('click', (e) => {
      if (e.target.classList.contains('zoomable-img')) {
        const imgSrc = e.target.getAttribute('src');
        const imgAlt = e.target.getAttribute('alt') || '가이드 스크린샷';
        
        lightboxImg.src = imgSrc;
        if (lightboxCaption) {
          lightboxCaption.textContent = imgAlt;
        }
        
        lightboxModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Disable page scrolling
      }
    });

    // Close lightbox when clicking close button or background overlay
    const closeLightbox = () => {
      lightboxModal.classList.remove('active');
      document.body.style.overflow = ''; // Restore page scrolling
    };

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal || e.target.classList.contains('lightbox-content')) {
        closeLightbox();
      }
    });

    // Close on Escape key press
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightboxModal.classList.contains('active')) {
        closeLightbox();
      }
    });
  }

});

