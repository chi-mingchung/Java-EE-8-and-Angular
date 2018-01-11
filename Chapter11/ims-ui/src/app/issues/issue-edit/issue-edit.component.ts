import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { forkJoin } from "rxjs/observable/forkJoin";
import { FormGroup, FormBuilder, Validators, NgForm } from '@angular/forms';

import { IssuesService } from '../../shared/issues.service';
import { UsersService } from '../../shared/users.service';
import { AuthService } from '../../shared/auth.service';

import { Issue } from '../../domain/issue';
import { User } from '../../domain/user';
import { Comment } from '../../domain/comment';


@Component({
  selector: 'app-issue-edit',
  templateUrl: './issue-edit.component.html',
  styleUrls: ['./issue-edit.component.css']
})

export class IssueEditComponent implements OnInit {
  issue: Issue;
  users: User[];
  public issueForm: FormGroup;
  comment: string;

  constructor(private router: Router,
    private route: ActivatedRoute,
    private usersService: UsersService,
    private issuesService: IssuesService,
    private authService: AuthService,
    fb: FormBuilder) {
    this.issueForm = fb.group({
      id: null,
      label: [null, [Validators.required, Validators.minLength(2)], null],
      description: [null, Validators.required],
      assignedTo: [null, Validators.required]
    });
  }

  ngOnInit() {
    this.usersService.getAll().subscribe(res => {
      this.users = res;
    })

    this.route.params.subscribe((params: Params) => {
      let id = +params['id'];
      console.log('loading issue', id);

      // this.issuesService.get(id).subscribe( (issue: Issue) => {
      //   this.issue = issue;
      // })

      let issueDetail = this.issuesService.get(id);
      let issueComments = this.issuesService.getComments(id);

      forkJoin([issueDetail, issueComments]).subscribe(results => {
        // results[0] is our issue
        // results[1] is our comments
        this.issue = results[0];
        this.issue.comments = results[1];

        this.updateForm();
      });
    });
  }

  updateForm() {
    this.issueForm.patchValue({
      id: this.issue.id,
      label: this.issue.label,
      description: this.issue.description,
      assignedTo: {
        id: this.issue.assignedTo.id,
        name: this.issue.assignedTo.name
      }
    });
  }

  onSave() {
    console.log(this.issueForm.value);
    this.issuesService.update(this.issueForm.value).subscribe(res => {
      this.router.navigate(['issues']);
    });

  }

  onComment(f: NgForm) {
    console.log('comment', this.comment);
    let newComment = new Comment();
    newComment.byUser = this.authService.currentUser.id;
    newComment.forIssue = this.issue.id;
    newComment.text = this.comment;
    this.issuesService.addComment(this.issue.id, newComment).subscribe(res => {
        console.log('saved comment now reloading');
        this.issuesService.getComments(this.issue.id).subscribe(result => {});
    });
  }

  deleteIssue() {
    if (confirm("Are you sure you wish to delete?")) {
      this.issuesService.delete(this.issue.id).subscribe(res => {
        this.backToList();
      });
    }
  }

  backToList() {
    this.router.navigate(['/issues']);
  }

  compareUser(user1, user2): boolean {
    return user1 && user2 ? user1.id === user2.id : user1 === user2;
  }
}
