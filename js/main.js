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

});