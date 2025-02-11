document.addEventListener('DOMContentLoaded', function() {
    new Vue({
        el: '#app',
        template: '<div>Kanban Board</div>'
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

});