import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Navbar } from '../navbar/navbar';
import { Toast } from '../../shared/components/toast/toast';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Sidebar, Navbar, Toast],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {}
