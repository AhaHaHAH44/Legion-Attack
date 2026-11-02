// ==UserScript==
// @name         Legion - Обстрел
// @namespace    https://github.com/AhaHaHAHA44/Legion-Attack
// @version      1.3
// @description  Добавляет кнопки упоминания пользователей в Multidonate. Поддерживает именованные варианты сообщений.
// @author       Sectwi1l
// @homepageURL  https://github.com/AhaHaHAHA44/Legion-Attack
// @supportURL   https://github.com/AhaHaHAHA44/Legion-Attack/issues
// @updateURL    https://raw.githubusercontent.com/AhaHaHAH44/Legion-Attack/main/Legion_Attack.user.js
// @downloadURL  https://raw.githubusercontent.com/AhaHaHAH44/Legion-Attack/main/Legion_Attack.user.js
// @match        https://play.multidonate.ru/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    // =====================================
    // НАСТРОЙКИ
    // =====================================

    const BUTTON_TEXT = '🎯';
    const STORAGE_KEY = 'legion_attack_messages';

    const DEFAULT_MESSAGES = [
        {
            name: 'Обстрел',
            text: 'ОБСТРЕЛ!!! Kappa KEKW PepeLaugh'
        }
    ];

    let messages = loadMessages();
    let activeIndex = 0;

    function loadMessages() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

            if (Array.isArray(saved) && saved.length) {
                // Совместимость со старым форматом, где хранились только строки.
                return saved
                    .filter(item => typeof item === 'string' ||
                        (item && typeof item === 'object'))
                    .map((item, index) => {
                        if (typeof item === 'string') {
                            return {
                                name: `Вариант ${index + 1}`,
                                text: item
                            };
                        }

                        return {
                            name: typeof item.name === 'string' && item.name.trim()
                                ? item.name
                                : `Вариант ${index + 1}`,
                            text: typeof item.text === 'string' ? item.text : ''
                        };
                    });
            }
        } catch (e) {}

        return DEFAULT_MESSAGES.map(item => ({ ...item }));
    }

    function saveMessages() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }

    // =====================================
    // ОТПРАВКА СООБЩЕНИЯ
    // =====================================

    function sendMessage(nick) {
        const forms = [...document.querySelectorAll('form.cy-chat-f')];

        const form = forms.find(f =>
            f.getClientRects().length > 0
        );

        if (!form) {
            alert('Не удалось найти активный чат!');
            return;
        }

        const input = form.querySelector('input[type="text"]');
        const submit = form.querySelector('button[type="submit"]');

        if (!input || !submit) {
            alert('Не удалось найти поле отправки!');
            return;
        }

        const message = messages[activeIndex]?.text ?? '';

        if (!message.trim()) {
            alert('Сначала напиши текст сообщения!');
            return;
        }

        input.value = `@${nick} ${message}`;

        input.dispatchEvent(new Event('input', {
            bubbles: true
        }));

        submit.click();
    }

    // =====================================
    // СТИЛЬ КНОПКИ ОБСТРЕЛА
    // =====================================

    function createAttackButton(nick) {
        const button = document.createElement('button');

        button.type = 'button';
        button.className = 'legion-attack-button';
        button.textContent = BUTTON_TEXT;
        button.title = 'Отправить сообщение с упоминанием';

        button.style.cssText = `
            margin-right: 3px;
            padding: 0px 3px;
            border: 1px solid rgba(180, 187, 205, 0.38);
            border-radius: 3px;
            background: rgba(48, 52, 67, 0.92);
            color: white;
            font-size: 9px;
            line-height: 14px;
            cursor: pointer;
            vertical-align: middle;
            transition: background 0.2s, border-color 0.2s;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.background = '#356b45';
            button.style.borderColor = '#5aab70';
        });

        button.addEventListener('mouseleave', () => {
            button.style.background = 'rgba(48, 52, 67, 0.92)';
            button.style.borderColor = 'rgba(180, 187, 205, 0.38)';
        });

        button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();

            sendMessage(nick);
        });

        return button;
    }

    // =====================================
    // ДОБАВЛЕНИЕ КНОПОК К НИКАМ
    // =====================================

    function addButtons() {
        document.querySelectorAll(
            '.cy-chat-l b[data-nick]'
        ).forEach(nickElement => {

            const row = nickElement.closest('li');

            if (!row || row.querySelector('.legion-attack-button')) {
                return;
            }

            const nick = nickElement.dataset.nick?.trim();

            if (!nick) return;

            row.prepend(createAttackButton(nick));
        });
    }

    // =====================================
    // ОКНО НАСТРОЕК
    // =====================================

    const panel = document.createElement('div');

    panel.id = 'legion-attack-settings';

    panel.style.cssText = `
        display: none;
        position: fixed;
        z-index: 999999;
        width: 270px;
        padding: 12px;
        background: rgba(25, 28, 40, 0.88);
        color: #e0e3ed;
        border: 1px solid rgba(170, 178, 200, 0.28);
        border-radius: 8px;
        box-shadow: 0 8px 28px rgba(0,0,0,.38);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        font-family: Arial, sans-serif;
        font-size: 12px;
    `;

    panel.innerHTML = `
        <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-bottom:10px;
        ">
            <b style="font-size:14px;">Настройки обстрела</b>

            <button id="legion-close"
                style="background:none;border:none;color:white;cursor:pointer;font-size:17px;">
                ×
            </button>
        </div>

        <div style="margin-bottom:6px;color:#aaa;">
            Выбери вариант сообщения:
        </div>

        <div style="display:flex;gap:5px;margin-bottom:10px;">
            <select id="legion-variants"
                style="
                    flex:1;
                    min-width:0;
                    padding:6px;
                    background:rgba(12, 14, 23, 0.62);
                    color:#e0e3ed;
                    border:1px solid rgba(160, 168, 190, 0.32);
                    border-radius:4px;
                ">
            </select>

            <button id="legion-add"
                title="Добавить вариант"
                style="
                    width:30px;
                    background:rgba(67, 74, 94, 0.92);
                    color:#eef0f6;
                    border:1px solid rgba(170, 178, 200, 0.25);
                    border-radius:4px;
                    cursor:pointer;
                    font-size:18px;
                ">+</button>
        </div>

        <div style="margin-bottom:6px;color:#aaa;">
            Название варианта:
        </div>

        <input id="legion-variant-name"
            type="text"
            maxlength="40"
            placeholder="Например: Приветствие"
            style="
                box-sizing:border-box;
                width:100%;
                margin-bottom:10px;
                padding:7px;
                background:rgba(12, 14, 23, 0.62);
                color:#e0e3ed;
                border:1px solid rgba(160, 168, 190, 0.32);
                border-radius:4px;
                font-family:Arial,sans-serif;
                font-size:12px;
            ">

        <div style="margin-bottom:6px;color:#aaa;">
            Текст сообщения:
        </div>

        <textarea id="legion-message"
            rows="4"
            style="
                box-sizing:border-box;
                width:100%;
                resize:vertical;
                padding:7px;
                background:rgba(12, 14, 23, 0.62);
                color:#e0e3ed;
                border:1px solid rgba(160, 168, 190, 0.32);
                border-radius:4px;
                font-family:Arial,sans-serif;
                font-size:12px;
            "></textarea>

        <div style="
            display:flex;
            justify-content:space-between;
            gap:6px;
            margin-top:10px;
        ">
            <button id="legion-delete"
                style="
                    padding:6px 9px;
                    background:rgba(67, 74, 94, 0.72);
                    color:#e0e3ed;
                    border:1px solid rgba(170, 178, 200, 0.22);
                    border-radius:4px;
                    cursor:pointer;
                ">Удалить</button>

            <button id="legion-save"
                style="
                    padding:6px 12px;
                    background:rgba(67, 74, 94, 0.92);
                    color:#eef0f6;
                    border:1px solid rgba(170, 178, 200, 0.25);
                    border-radius:4px;
                    cursor:pointer;
                ">Сохранить</button>
        </div>

        <div style="margin-top:8px;color:#888;font-size:10px;">
            Ник и @ добавляются автоматически. Названия видны только в этом меню.
        </div>
    `;

    // =====================================
    // ДОПОЛНИТЕЛЬНЫЕ СТИЛИ ОКНА
    // =====================================

    const panelStyle = document.createElement('style');

    panelStyle.textContent = `
        #legion-attack-settings {
            background: rgba(25, 28, 40, 0.88) !important;
            color: #e0e3ed !important;
            border-color: rgba(170, 178, 200, 0.28) !important;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }

        #legion-attack-settings select,
        #legion-attack-settings input,
        #legion-attack-settings textarea {
            background: rgba(12, 14, 23, 0.62) !important;
            color: #e0e3ed !important;
            border-color: rgba(160, 168, 190, 0.32) !important;
        }

        #legion-attack-settings button:not(#legion-close) {
            transition: background 0.18s, border-color 0.18s;
        }

        #legion-attack-settings button:not(#legion-close):hover {
            background: rgba(88, 96, 119, 0.95) !important;
            border-color: rgba(190, 198, 218, 0.55) !important;
        }

        #legion-attack-settings #legion-close {
            background: transparent !important;
            border: 0 !important;
            color: #d5d8e2 !important;
        }

        #legion-attack-settings #legion-close:hover {
            color: #ffffff !important;
        }
    `;

    document.head.appendChild(panelStyle);
    document.body.appendChild(panel);

    const select = panel.querySelector('#legion-variants');
    const nameInput = panel.querySelector('#legion-variant-name');
    const textarea = panel.querySelector('#legion-message');

    function renderVariants() {
        select.innerHTML = '';

        messages.forEach((message, index) => {
            const option = document.createElement('option');

            option.value = index;
            option.textContent = message.name.trim() || `Вариант ${index + 1}`;

            select.appendChild(option);
        });

        select.value = activeIndex;
        nameInput.value = messages[activeIndex]?.name ?? '';
        textarea.value = messages[activeIndex]?.text ?? '';
    }

    // =====================================
    // ВЫБОР ВАРИАНТА
    // =====================================

    select.addEventListener('change', () => {
        activeIndex = Number(select.value);
        renderVariants();
    });

    // =====================================
    // ИЗМЕНЕНИЕ НАЗВАНИЯ
    // =====================================

    nameInput.addEventListener('input', () => {
        messages[activeIndex].name = nameInput.value;

        const option = select.options[activeIndex];

        if (option) {
            option.textContent = nameInput.value.trim() ||
                `Вариант ${activeIndex + 1}`;
        }

        saveMessages();
    });

    // =====================================
    // ИЗМЕНЕНИЕ ТЕКСТА
    // =====================================

    textarea.addEventListener('input', () => {
        messages[activeIndex].text = textarea.value;
        saveMessages();
    });

    // =====================================
    // ДОБАВЛЕНИЕ НОВОГО ВАРИАНТА
    // =====================================

    panel.querySelector('#legion-add').addEventListener('click', () => {
        messages.push({
            name: `Вариант ${messages.length + 1}`,
            text: ''
        });

        activeIndex = messages.length - 1;

        saveMessages();
        renderVariants();

        nameInput.focus();
        nameInput.select();
    });

    // =====================================
    // УДАЛЕНИЕ ВАРИАНТА
    // =====================================

    panel.querySelector('#legion-delete').addEventListener('click', () => {
        if (messages.length <= 1) {
            alert('Должен остаться хотя бы один вариант!');
            return;
        }

        messages.splice(activeIndex, 1);
        activeIndex = Math.max(0, activeIndex - 1);

        saveMessages();
        renderVariants();
    });

    // =====================================
    // СОХРАНЕНИЕ
    // =====================================

    panel.querySelector('#legion-save').addEventListener('click', () => {
        messages[activeIndex].name = nameInput.value;
        messages[activeIndex].text = textarea.value;

        saveMessages();
        panel.style.display = 'none';
    });

    // =====================================
    // ЗАКРЫТИЕ
    // =====================================

    panel.querySelector('#legion-close').addEventListener('click', () => {
        panel.style.display = 'none';
    });

    renderVariants();

    // =====================================
    // КНОПКА ШЕСТЕРЕНКИ НАД ЧАТОМ
    // =====================================

    function addSettingsButton() {
        document.querySelectorAll('.cy-chat-h').forEach(header => {

            if (header.querySelector('.legion-settings-button')) {
                return;
            }

            const gear = document.createElement('button');

            gear.type = 'button';
            gear.className = 'legion-settings-button';
            gear.textContent = '⚙';
            gear.title = 'Настройки обстрела';

            gear.style.cssText = `
                margin-right: 6px;
                padding: 1px 5px;
                background: rgba(48, 52, 67, 0.92);
                color: #e0e3ed;
                border: 1px solid rgba(180, 187, 205, 0.38);
                border-radius: 4px;
                font-size: 13px;
                cursor: pointer;
                line-height: 17px;
                transition: background 0.2s, border-color 0.2s;
            `;

            gear.addEventListener('mouseenter', () => {
                gear.style.background = 'rgba(72, 78, 98, 0.98)';
                gear.style.borderColor = 'rgba(190, 198, 218, 0.55)';
            });

            gear.addEventListener('mouseleave', () => {
                gear.style.background = 'rgba(48, 52, 67, 0.92)';
                gear.style.borderColor = 'rgba(180, 187, 205, 0.38)';
            });

            gear.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();

                if (panel.style.display === 'block') {
                    panel.style.display = 'none';
                    return;
                }

                const rect = gear.getBoundingClientRect();

                panel.style.display = 'block';

                const panelWidth = 270;

                const left = Math.min(
                    rect.left,
                    window.innerWidth - panelWidth - 10
                );

                panel.style.left = `${Math.max(10, left)}px`;

                panel.style.top = `${Math.min(
                    rect.bottom + 6,
                    window.innerHeight - 340
                )}px`;

                renderVariants();
            });

            const closeButton = header.querySelector('.cy-chat-x');

            header.insertBefore(gear, closeButton || header.firstChild);
        });
    }

    // =====================================
    // ОТСЛЕЖИВАНИЕ ИЗМЕНЕНИЙ ЧАТА
    // =====================================

    function updateChat() {
        addButtons();
        addSettingsButton();
    }

    const observer = new MutationObserver(updateChat);

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    updateChat();

})();
