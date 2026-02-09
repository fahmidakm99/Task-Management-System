import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  private apiUrl = 'https://taskmanager-c5b87-default-rtdb.firebaseio.com'; 

  isModalOpen = false; // Controls modal visibility
  isTaskModalOpen = false;
  categoryName = ''; // Stores entered category name
  taskName = '';

  completedTasks: { [key: string]: boolean[] } = {}; // Track completed status
  categories: string[] = [];
  selectedCategory: string | null = null; // Stores selected category
  tasks: { [key: string]: string[] } = {}; 

  swipedIndex: number | null = null;
touchStartX = 0;
touchEndX = 0;

swipedCategory: string | null = null;
touchStartXCategory = 0;
touchEndXCategory = 0;
showingPendingTasks = true;
pendingTasks: { name: string; category: string }[] = [];

  constructor(private cdr: ChangeDetectorRef, private http: HttpClient) {
    this.fetchCategories();
    this.fetchTasks();
  }

  fetchCategories() {
    this.http.get<{ [key: string]: { name: string } }>(`${this.apiUrl}/categories.json`).subscribe((data) => {
      this.categories = data ? Object.values(data).map((d) => d.name) : [];
      this.cdr.detectChanges(); // Force UI update
    });
  }

  
  fetchTasks() {
    this.http.get<{ [key: string]: { name: string; category: string; completed?: boolean } }>(`${this.apiUrl}/tasks.json`)
      .subscribe((data) => {
        this.tasks = {};
        this.completedTasks = {}; // Reset completed tasks
  
        if (data) {
          Object.entries(data).forEach(([taskId, task]) => {
            if (!this.tasks[task.category]) {
              this.tasks[task.category] = [];
            }
            this.tasks[task.category].push(task.name);
  
            // Store completion status
            if (!this.completedTasks[task.category]) {
              this.completedTasks[task.category] = [];
            }
            this.completedTasks[task.category].push(task.completed || false);
          });
        }
        this.showPendingTasks(); 
        this.cdr.detectChanges(); // Force UI update
      });
  }
  

openAddCategoryDialog() {
  this.isModalOpen = true;
  this.cdr.detectChanges(); // <- ensures modal is displayed immediately
}

openAddTaskDialog() {
  this.isTaskModalOpen = true;
  this.cdr.detectChanges(); // <- ensures modal is displayed immediately
}


  closeModal() {
    this.isModalOpen = false;
    this.categoryName = ''; // Reset input field when closing
  }

  async saveCategory() {
    if (this.categoryName.trim()) {
      await this.http.post(`${this.apiUrl}/categories.json`, { name: this.categoryName }).toPromise();
      this.fetchCategories(); // Refresh categories
      this.closeModal();
    } else {
      alert('Please enter a category name!');
    }
  }

  markAsCompleted(category: string, index: number) {
    if (!this.completedTasks[category]) {
      this.completedTasks[category] = [];
    }
    
    // Find the task in Firebase and update it
    this.http.get<{ [key: string]: { name: string; category: string; completed: boolean } }>(`${this.apiUrl}/tasks.json`)
      .subscribe((data) => {
        if (data) {
          const taskEntries = Object.entries(data);
          const taskId = taskEntries.find(([id, task]) =>
            task.category === category && task.name === this.tasks[category][index]
          )?.[0];
  
          if (taskId) {
            // Update the task's completed status in Firebase
            this.http.patch(`${this.apiUrl}/tasks/${taskId}.json`, { completed: true }).subscribe(() => {
              // Update local state without reloading
              this.completedTasks[category][index] = true;
  
              // Remove from pendingTasks
              this.pendingTasks = this.pendingTasks.filter(task => !(task.name === this.tasks[category][index] && task.category === category));
  
              this.cdr.detectChanges(); // Update UI dynamically
            });
          }
        }
      });
  }
  


  closeTaskModal() {
    this.isTaskModalOpen = false;
    this.taskName = ''; // Reset input field when closing
  }


  async saveTask() {
    if (!this.taskName.trim()) {
      alert('Please enter a task name!');
      return;
    }
  
    if (!this.selectedCategory) {
      alert('Please select a category!');
      return;
    }
  
    await this.http.post(`${this.apiUrl}/tasks.json`, {
      name: this.taskName,
      category: this.selectedCategory, // Use existing selectedCategory
      completed: false
    }).toPromise();
  
    this.fetchTasks(); // Refresh tasks
    this.closeTaskModal();
  }
  
  
  onTouchStart(event: TouchEvent, index: number) {
    this.touchStartX = event.touches[0].clientX;
  }
  
  onTouchMove(event: TouchEvent, index: number) {
    this.touchEndX = event.touches[0].clientX;
  }
  
  onTouchEnd(index: number) {
    if (this.touchStartX - this.touchEndX > 50) { // Swiped left
      this.swipedIndex = index;
    } else if (this.touchEndX - this.touchStartX > 50) { // Swiped right
      this.swipedIndex = null;
    }
  }


deleteTask(category: string, index: number) {
  this.http.get<{ [key: string]: { name: string; category: string; completed: boolean } }>(`${this.apiUrl}/tasks.json`)
    .subscribe((data) => {
      if (data) {
        const taskEntries = Object.entries(data);
        const taskId = taskEntries.find(([id, task]) =>
          task.category === category && task.name === this.tasks[category][index]
        )?.[0];

        if (taskId) {
          this.http.delete(`${this.apiUrl}/tasks/${taskId}.json`).subscribe(() => {
            // Remove task from local state
            this.tasks[category].splice(index, 1);
            this.completedTasks[category].splice(index, 1);

            // If the category is empty, remove it
            if (this.tasks[category].length === 0) {
              delete this.tasks[category];
              delete this.completedTasks[category];
            }

            // Remove from pendingTasks if applicable
            this.pendingTasks = this.pendingTasks.filter(task => !(task.category === category && task.name === this.tasks[category]?.[index]));

            this.swipedIndex = null; // Close swipe action
            this.cdr.detectChanges(); // Update UI without reloading
          });
        }
      }
    });
}
resetTask(category: string, index: number) {
  this.http.get<{ [key: string]: { name: string; category: string; completed: boolean } }>(`${this.apiUrl}/tasks.json`)
    .subscribe((data) => {
      if (data) {
        const taskEntries = Object.entries(data);
        const taskId = taskEntries.find(([id, task]) =>
          task.category === category && task.name === this.tasks[category][index]
        )?.[0];

        if (taskId) {
          this.http.patch(`${this.apiUrl}/tasks/${taskId}.json`, { completed: false }).subscribe(() => {
            // Update local state without reloading
            this.completedTasks[category][index] = false;

            // Add back to pendingTasks if not already there
            if (!this.pendingTasks.some(task => task.name === this.tasks[category][index] && task.category === category)) {
              this.pendingTasks.push({ name: this.tasks[category][index], category });
            }

            this.swipedIndex = null; // Close swipe action
            this.cdr.detectChanges(); // Update UI dynamically
          });
        }
      }
    });
}


showPendingTasks() {
  this.selectedCategory = null; // Clear selected category
  this.showingPendingTasks = true;

  this.pendingTasks = [];

  Object.entries(this.tasks).forEach(([category, taskList]) => {
    taskList.forEach((task, index) => {
      if (!this.completedTasks[category]?.[index]) {
        this.pendingTasks.push({ name: task, category });
      }
    });
  });

  this.cdr.detectChanges();
}

showCategories(category: string) {
  this.selectedCategory = category;
  this.showingPendingTasks = false; // Hide pending tasks when a category is selected
}



// Track touch start
onTouchStartCategory(event: TouchEvent, category: string) {
  this.touchStartXCategory = event.touches[0].clientX;
  this.swipedCategory = null; // Reset swipe state
}

// Track touch move
onTouchMoveCategory(event: TouchEvent) {
  this.touchEndXCategory = event.touches[0].clientX;
}

// Detect swipe left
onTouchEndCategory(category: string) {
  if (this.touchStartXCategory - this.touchEndXCategory > 50) { 
    // Swiped left
    this.swipedCategory = category;
  } else if (this.touchEndXCategory - this.touchStartXCategory > 50) {
    // Swiped right (reset)
    this.swipedCategory = null;
  }
}

// Delete category method
deleteCategory(category: string) {
  // First, get the category ID
  this.http.get<{ [key: string]: { name: string } }>(`${this.apiUrl}/categories.json`)
    .subscribe((data) => {
      if (data) {
        // Find the category ID based on its name
        const categoryId = Object.entries(data).find(([id, cat]) => cat.name === category)?.[0];

        if (categoryId) {
          // Delete all tasks related to this category
          this.http.get<{ [key: string]: { name: string; category: string } }>(`${this.apiUrl}/tasks.json`)
            .subscribe((taskData) => {
              if (taskData) {
                // Find all task IDs that belong to this category
                Object.entries(taskData).forEach(([taskId, task]) => {
                  if (task.category === category) {
                    this.http.delete(`${this.apiUrl}/tasks/${taskId}.json`).subscribe();
                  }
                });
              }
            });

          // Now, delete the category itself
          this.http.delete(`${this.apiUrl}/categories/${categoryId}.json`).subscribe(() => {
            // Refresh the categories list after deletion
            this.fetchCategories();
            this.swipedCategory = null; // Reset swipe action
            window.location.reload();
          });
        }
      }
    });
}


}