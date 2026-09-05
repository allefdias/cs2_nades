const API_URL = "https://script.google.com/macros/s/AKfycbxuwa0ufXZzvq1X2_79Mn3WhyeSrhrgWqNl7cwNj3Co4TuJtBLwSy0uhOzkAOWoWag/exec";

document.addEventListener('DOMContentLoaded', () => {
    const nadeForm = document.getElementById('nadeForm');
    const cardsGrid = document.getElementById('cardsGrid');
    const filterBtns = document.querySelectorAll('.nav-btn');

    // Elementos do Modal de Vídeo
    const modal = document.getElementById('videoModal');
    const modalIframe = document.getElementById('modalIframe');
    const modalHeader = document.getElementById('modalHeader');
    const modalDetails = document.getElementById('modalDetails');
    const closeModalBtn = document.querySelector('#videoModal .close-modal');

    // Elementos do Modal de Avisos/Mensagens
    const infoModal = document.getElementById('infoModal');
    const infoIcon = document.getElementById('infoIcon');
    const infoTitle = document.getElementById('infoTitle');
    const infoMessage = document.getElementById('infoMessage');
    const infoConfirmBtn = document.getElementById('infoConfirmBtn');
    const closeInfoModalBtn = document.querySelector('#infoModal .close-info-modal');

    let nades = [];

    // Exibe aviso inicial solicitando preferência por vídeos curtos
    showNotice(
        '💡',
        'Boas-vindas ao CS2 Lab!',
        'Para ajudar a comunidade com conteúdos objetivos, dê preferência a vídeos curtos (YouTube Shorts ou demonstrativos de poucos segundos).'
    );

    function showNotice(icon, title, message) {
        if (!infoModal) return;
        infoIcon.textContent = icon;
        infoTitle.textContent = title;
        infoMessage.textContent = message;
        infoModal.classList.add('active');
    }

    function closeNotice() {
        if (infoModal) infoModal.classList.remove('active');
    }

    function getVideoData(url) {
        let videoId = '';
        if (url.includes('shorts/')) {
            videoId = url.split('shorts/')[1].split('?')[0].split('&')[0];
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0].split('&')[0];
        } else if (url.includes('watch?v=')) {
            videoId = url.split('watch?v=')[1].split('&')[0];
        } else if (url.includes('embed/')) {
            videoId = url.split('embed/')[1].split('?')[0].split('&')[0];
        }

        if (!videoId) return null;

        return {
            videoId: videoId,
            embedUrl: `https://www.youtube.com/embed/${videoId}?enablejsapi=1`,
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        };
    }

    async function fetchNades() {
        cardsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #a8a8b3;">Carregando utilitários...</p>';
        try {
            const response = await fetch(API_URL);
            nades = await response.json();
            renderCards();
        } catch (error) {
            console.error('Erro ao buscar da planilha:', error);
            cardsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #f75a68;">Erro ao carregar os dados.</p>';
        }
    }

    function openModal(nade, e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        modalIframe.src = `${nade.embedUrl}&autoplay=1`;

        const sideClass = nade.side === 'TR' ? 'badge-tr' : 'badge-ct';

        modalHeader.innerHTML = `
            <div class="card-title-row">
                <span class="card-title" style="font-size: 20px;">${nade.title}</span>
                <span class="badge ${sideClass}">${nade.side}</span>
            </div>
            <div class="card-tags">
                <span class="badge badge-map">${nade.map}</span>
                <span class="badge badge-type">${nade.type}</span>
            </div>
        `;

        modalDetails.innerHTML = `
            <p><strong>Mapa:</strong> ${nade.map}</p>
            <p><strong>Lado:</strong> ${nade.side}</p>
            <p><strong>Tipo:</strong> ${nade.type}</p>
        `;

        modal.classList.add('active');
    }

    function closeModal() {
        modal.classList.remove('active');
        modalIframe.src = '';
    }

    function renderCards(filterMap = 'all') {
        cardsGrid.innerHTML = '';

        const filteredNades = filterMap === 'all' 
            ? nades 
            : nades.filter(nade => nade.map === filterMap);

        if (filteredNades.length === 0) {
            cardsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #a8a8b3;">Nenhum utilitário encontrado.</p>';
            return;
        }

        filteredNades.forEach((nade) => {
            const card = document.createElement('div');
            card.className = 'card';
            
            const sideClass = nade.side === 'TR' ? 'badge-tr' : 'badge-ct';

            card.innerHTML = `
                <div class="card-header">
                    <div class="card-title-row">
                        <span class="card-title">${nade.title}</span>
                        <span class="badge ${sideClass}">${nade.side}</span>
                    </div>
                    <div class="card-tags">
                        <span class="badge badge-map">${nade.map}</span>
                        <span class="badge badge-type">${nade.type}</span>
                    </div>
                </div>
                <div class="video-thumbnail-container">
                    <img src="${nade.thumbnailUrl}" alt="${nade.title}" class="card-thumbnail">
                    <div class="play-button-overlay">
                        <span>▶</span>
                    </div>
                </div>
            `;

            card.addEventListener('click', (e) => openModal(nade, e));
            cardsGrid.appendChild(card);
        });
    }

    nadeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = document.getElementById('saveBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';

        const title = document.getElementById('titleInput').value;
        const map = document.getElementById('mapSelect').value;
        const side = document.getElementById('sideSelect').value;
        const type = document.getElementById('typeSelect').value;
        const rawUrl = document.getElementById('videoUrl').value;
        
        const videoData = getVideoData(rawUrl);

        if (!videoData) {
            alert('URL do YouTube inválida!');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Salvar Card';
            return;
        }

        const newNade = { 
            title, 
            map, 
            side, 
            type, 
            embedUrl: videoData.embedUrl,
            thumbnailUrl: videoData.thumbnailUrl 
        };

        try {
            await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newNade)
            });

            // Reseta o formulário e restaura o botão
            nadeForm.reset();
            submitBtn.disabled = false;
            submitBtn.textContent = 'Salvar Card';

            // Exibe o modal de confirmação sem refazer a busca na planilha
            showNotice(
                '🎉',
                'Vídeo Enviado com Sucesso!',
                'Muito obrigado por colaborar! Seu vídeo foi enviado para análise e será publicado após a aprovação da moderação.'
            );

        } catch (error) {
            console.error('Erro ao enviar vídeo:', error);
            alert('Falha ao enviar o vídeo. Tente novamente.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Salvar Card';
        }
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const filter = e.target.getAttribute('data-filter');
            renderCards(filter);
        });
    });

    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    infoConfirmBtn.addEventListener('click', closeNotice);
    closeInfoModalBtn.addEventListener('click', closeNotice);
    infoModal.addEventListener('click', (e) => {
        if (e.target === infoModal) closeNotice();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeNotice();
        }
    });

    fetchNades();
});
