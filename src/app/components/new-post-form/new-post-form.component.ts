import {Component, OnInit, Input, Output, EventEmitter, OnDestroy} from '@angular/core';
import { Article } from '../../Models/Article';
import {
  FormGroup,
  FormBuilder,
  Validators
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { ArticleService } from '../../services/article.service';
import { NzModalService, NzMessageService } from 'ng-zorro-antd';
import 'rxjs/add/operator/debounceTime';

@Component({
  selector: 'app-new-post-form',
  templateUrl: './new-post-form.component.html',
  styleUrls: ['./new-post-form.component.scss']
})
export class NewPostFormComponent implements OnInit, OnDestroy {

  @Input() post: Article;
  @Output() postChange = new EventEmitter<Article>();

  public isCreating = false;
  public form: FormGroup;
  private formSubscription: Subscription;
  private formTitleChangeSubscription: Subscription;

  constructor(
    private fb: FormBuilder,
    private articleService: ArticleService,
    private modalService: NzModalService,
    private message: NzMessageService
  ) {
    this.form = this.fb.group({
      title: [ '', [ Validators.required ] ],
      published: [ false, [ Validators.required ] ]
    });
  }

  ngOnInit() {
    this.formTitleChangeSubscription = this.form.controls['title']
      .valueChanges
      .debounceTime(300)
      .subscribe(title => {
        const isTitleExist = this.articleService.checkIfExistFileName(title);
        if (isTitleExist) {
          this.form.controls['title'].setErrors( {'exist': true});
        } else if (!this.form.controls['title'].errors) {
          this.form.controls['title'].setErrors( null);
        }
      });

    this.formSubscription = this.form.valueChanges
      .subscribe(value => {
        this.postChange.emit(value);
      });
  }

  ngOnDestroy() {
    this.formTitleChangeSubscription.unsubscribe();
    this.formSubscription.unsubscribe();
  }

  public onSubmit() {
    this.isCreating = true;

    // validate form
    for (const i in this.form.controls) {
      if (this.form.controls[i]) {
        this.form.controls[i].markAsDirty();
        this.form.controls[i].updateValueAndValidity();
      }
    }
    this.articleService.create({
      title: this.form.value.title,
      published: this.form.value.published})
      .then(() => {
        this.isCreating = false;
        this.message.success('CREATE POST OK');
        this.modalService.closeAll();
      })
      .catch((err) => {
        this.message.error(`CREATE POST ERROR: ${err}`);
      });
  }
}
