document.addEventListener('DOMContentLoaded', function () {

    Vue.component('kanban-card', {
        props: ['card', 'columnIndex'],
        template: `
            <div class="kanban-card">
                <h3>{{ card.title }}</h3>
                <p>{{ card.description }}</p>
                <p>Создано: {{ card.createdAt }}</p>
                <p v-if="card.lastEdited">Изменено: {{ card.lastEdited }}</p>
                <p>Дедлайн: {{ card.deadline }}</p>
                <p v-if="card.isOverdue" class="overdue">Просрочено</p>
                <p v-if="card.isCompleted" class="completed">Выполнено в срок</p>
                <p v-if="card.returnReason">Причина возврата: {{ card.returnReason }}</p>
                <div>
                    <button @click="$emit('edit-card')">Редактировать</button>
                    <button @click="$emit('delete-card')">Удалить</button>
                    <button v-if="columnIndex === 0" @click="move(1)">В работу</button>
                    <button v-if="columnIndex === 1" @click="move(2)">Тестирование</button>
                    <button v-if="columnIndex === 2" @click="$emit('open-return-modal', card.id)">Вернуть</button>
                    <button v-if="columnIndex === 2" @click="move(3)">Завершить</button>
                </div>
            </div>
        `,
        methods: {
            move(toColumn) {
                this.$emit('move-card', {
                    cardId: this.card.id,
                    from: this.columnIndex,
                    to: toColumn
                });
            }
        }
    });

    Vue.component('kanban-column', {
        props: ['column', 'columnIndex'],
        template: `
            <div class="kanban-column">
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
                    @open-return-modal="$emit('open-return-modal', $event)"
                />
            </div>
        `
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
                    @open-return-modal="$emit('open-return-modal', $event)"
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
            currentCardId: null
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
            openReturnModal(cardId) {
                this.currentCardId = cardId;
                this.showReturnModal = true;
            },
            confirmReturn() {
                const card = this.findCard(this.currentCardId);
                if (card) {
                    card.returnReason = this.returnReason;
                    this.moveCard({
                        cardId: this.currentCardId,
                        from: 2,
                        to: 1
                    });
                    this.closeReturnModal();
                }
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
            }
        }
    });
});