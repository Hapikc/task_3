document.addEventListener('DOMContentLoaded', function() {
    new Vue({
        el: '#app',
        data: () => ({
            columns: [
                { title: 'Запланированные', cards: [] },
                { title: 'В работе', cards: [] },
                { title: 'Тестирование', cards: [] },
                { title: 'Завершённые', cards: [] }
            ]
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
            }
        }
    });

    Vue.component('kanban-card', {
        props: ['card'],
        template: `
        <div class="kanban-card">
            <h3>{{ card.title }}</h3>
            <p>{{ card.description }}</p>
            <p>Дедлайн: {{ card.deadline }}</p>
        </div>
    `
    });

    Vue.component('kanban-column', {
        props: ['column'],
        template: `
        <div class="kanban-column">
            <h2>{{ column.title }}</h2>
            <kanban-card 
                v-for="card in column.cards" 
                :key="card.id" 
                :card="card"
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
            />
        </div>
    `
    });

});