document.addEventListener('DOMContentLoaded', function() {
    new Vue({
        el: '#app',
        data: () => ({
            columns: [
                { title: 'Запланированные', cards: [] },
                { title: 'В работе', cards: [] },
                { title: 'Тестирование', cards: [] },
                { title: 'Завершённые', cards: [] }
            ],
            showModal: false,
            editingCard: null
        }),
        template: '<kanban-board :columns="columns"/>',
        methods: {
            addCard(columnIndex) {
                this.columns[columnIndex].cards.push({
                    id: Date.now(),
                    title: `Задача ${this.columns[columnIndex].cards.length + 1}`,
                    description: 'Описание задачи',
                    deadline: '2023-12-31'
                });
            },
            deleteCard(cardId) {
                this.columns.forEach(col => {
                    col.cards = col.cards.filter(c => c.id !== cardId);
                });
            },
            openEditModal(card) {
                this.formData = {...card};
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
        }
    });

    Vue.component('kanban-card', {
        props: ['card'],
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
        props: ['column'],
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

});