import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../core/services/category';
import { ToastService } from '../../../core/services/toast';

@Component({
  selector: 'app-category-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './category-list.html',
  styleUrl: './category-list.css',
})
export class CategoryList implements OnInit {
  categoryService = inject(CategoryService);
  toastService = inject(ToastService);

  categories: any[] = [];
  isAddOpen = false;
  newCategory = { name: '', color: '#10B981' };

  ngOnInit() {
    this.categoryService.categories$.subscribe(data => {
      this.categories = data || [];
    });
    this.categoryService.loadCategories().subscribe();
  }

  saveCategory() {
    if (!this.newCategory.name) return;

    this.categoryService.createCategory(this.newCategory).subscribe({
      next: (res) => {
        this.toastService.show('Category Added', `Successfully added category "${res.name}".`, 'success');
        this.isAddOpen = false;
        this.newCategory = { name: '', color: '#10B981' };
      },
      error: () => {
        this.toastService.show('Error', 'Failed to add category.', 'error');
      }
    });
  }

  deleteCategory(id: number) {
    if (confirm('Are you sure you want to delete this category? All associated budgets & expenses will be affected.')) {
      this.categoryService.deleteCategory(id).subscribe({
        next: () => {
          this.toastService.show('Deleted', 'Category successfully removed.', 'success');
        },
        error: () => {
          this.toastService.show('Error', 'Failed to delete category.', 'error');
        }
      });
    }
  }
}
