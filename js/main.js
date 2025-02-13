document.addEventListener('DOMContentLoaded', function () {
    Vue.component('kanban-card', {
        props: ['card', 'columnIndex'],
        template: `
            <div class="kanban-card" draggable="true"
                 @dragstart="onDragStart"
                 @dragover.prevent
                 @drop="onDrop"
                 :class="{ dragging: isDragging }">
                <h3>{{ card.title }}</h3>
                <p>{{ card.description }}</p>
                <p>Создано: {{ card.createdAt }}</p>
                <p v-if="card.lastEdited">Изменено: {{ card.lastEdited }}</p>
                <p>Дедлайн: {{ card.deadline }}</p>
                <p v-if="card.isOverdue" class="overdue">Просрочено</p>
                <p v-if="card.isCompleted" class="completed">Выполнено в срок</p>
                <p v-if="card.returnReason">Причина возврата: {{ card.returnReason }}</p>
                <div>
                    <button v-if="columnIndex !== 3" @click="$emit('edit-card')">Редактировать</button>
                    <button @click="$emit('delete-card')">Удалить</button>
                </div>
            </div>
        `,
        data() {
            return {
                isDragging: false
            };
        },
        methods: {
            onDragStart(event) {
                this.isDragging = true;
                event.dataTransfer.setData('text/plain', JSON.stringify({
                    cardId: this.card.id,
                    fromColumn: this.columnIndex
                }));
            },
            onDrop(event) {
                this.isDragging = false;
                event.preventDefault();
                const data = JSON.parse(event.dataTransfer.getData('text/plain'));
                this.$emit('move-card', {
                    cardId: data.cardId,
                    from: data.fromColumn,
                    to: this.columnIndex
                });
            }
        }
    });

    Vue.component('kanban-column', {
        props: ['column', 'columnIndex'],
        template: `
            <div class="kanban-column" @dragover.prevent @drop="onDrop">
                <h2>{{ column.title }}</h2>
                <button v-if="columnIndex === 0" @click="$emit('add-card')">Новая карточка</button>
                <kanban-card 
                    v-for="card in column.cards" 
                    :key="card.id" 
                    :card="card" 
                    :column-index="columnIndex"
                    @edit-card="$emit('edit-card', card)"
                    @delete-card="$emit('delete-card', card.id)"
                    @move-card="$emit('move-card', $event)"
                />
            </div>
        `,
        methods: {
            onDrop(event) {
                event.preventDefault();
                const data = JSON.parse(event.dataTransfer.getData('text/plain'));
                this.$emit('move-card', {
                    cardId: data.cardId,
                    from: data.fromColumn,
                    to: this.columnIndex
                });
            }
        }
    });

    Vue.component('kanban-board', {
        props: ['columns'],
        template: `
            <div class="kanban-board">
                <kanban-column 
                    v-for="(column, index) in columns" 
                    :key="index" 
                    :column="column" 
                    :column-index="index"
                    @add-card="$emit('add-card')"
                    @edit-card="$emit('edit-card', $event)"
                    @delete-card="$emit('delete-card', $event)"
                    @move-card="$emit('move-card', $event)"
                />
            </div>
        `
    });

    new Vue({
        el: '#app',
        data: () => ({
            columns: [
                { title: 'Запланированные', cards: [] },
                { title: 'В работе', cards: [] },
                { title: 'Тестирование', cards: [] },
                { title: 'Завершённые', cards: [] }
            ],
            showCardModal: false,
            showReturnModal: false,
            formData: { title: '', description: '', deadline: '' },
            editingCard: null,
            returnReason: '',
            currentCardId: null,
            pendingMove: null // Для хранения данных о перемещении
        }),
        methods: {
            openAddModal() {
                this.formData = { title: '', description: '', deadline: '' };
                this.editingCard = null;
                this.showCardModal = true;
            },
            openEditModal(card) {
                this.formData = { ...card };
                this.editingCard = card;
                this.showCardModal = true;
            },
            saveCard() {
                if (!this.formData.title || !this.formData.deadline) return;

                if (this.editingCard) {
                    Object.assign(this.editingCard, this.formData, {
                        lastEdited: new Date().toLocaleString()
                    });
                } else {
                    this.columns[0].cards.push({
                        id: Date.now(),
                        ...this.formData,
                        createdAt: new Date().toLocaleString(),
                        lastEdited: null,
                        isOverdue: false,
                        isCompleted: false,
                        returnReason: null
                    });
                }
                this.closeModal();
            },
            deleteCard(cardId) {
                this.columns.forEach(col => col.cards = col.cards.filter(c => c.id !== cardId));
            },
            moveCard({ cardId, from, to }) {
                // Если перемещение из "Тестирование" в "В работу", запрашиваем причину
                if (from === 2 && to === 1) {
                    this.currentCardId = cardId;
                    this.pendingMove = { cardId, from, to };
                    this.showReturnModal = true;
                } else {
                    this.performMove(cardId, from, to);
                }
            },
            performMove(cardId, from, to) {
                const card = this.findCard(cardId);
                if (!card) return;

                this.columns[from].cards = this.columns[from].cards.filter(c => c.id !== cardId);

                if (to === 3) {
                    const deadline = new Date(card.deadline);
                    card.isOverdue = new Date() > deadline;
                    card.isCompleted = !card.isOverdue;
                    card.returnReason = null;
                }

                this.columns[to].cards.push(card);
            },
            confirmReturn() {
                if (!this.returnReason.trim()) {
                    alert('Укажите причину возврата');
                    return;
                }
                const card = this.findCard(this.currentCardId);
                if (card) {
                    card.returnReason = this.returnReason;
                    this.performMove(this.pendingMove.cardId, this.pendingMove.from, this.pendingMove.to);
                    this.closeReturnModal();
                }
            },
            cancelReturn() {
                this.closeReturnModal();
            },
            findCard(cardId) {
                for (const col of this.columns) {
                    const card = col.cards.find(c => c.id === cardId);
                    if (card) return card;
                }
                return null;
            },
            closeModal() {
                this.showCardModal = false;
                this.formData = { title: '', description: '', deadline: '' };
                this.editingCard = null;
            },
            closeReturnModal() {
                this.showReturnModal = false;
                this.returnReason = '';
                this.currentCardId = null;
                this.pendingMove = null;
            }
        }
    });
});