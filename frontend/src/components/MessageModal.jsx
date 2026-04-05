import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getCategoryI18nKey } from '../utils';
import DatePicker from 'react-datepicker';
import { registerLocale } from 'react-datepicker';
import { format } from 'date-fns';
import { fi, enUS } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('fi', fi);
registerLocale('en', enUS);

const DATE_FORMATS = { fi: 'd.M.yyyy', en: 'MM/dd/yyyy' };
const PLACEHOLDERS = { fi: 'pp.kk.vvvv', en: 'MM/DD/YYYY' };

export function MessageModal({
  isOpen,
  editingMessage,
  editingId,
  onClose,
  onSubmit,
  defaultCategory,
}) {
  const { t, i18n } = useTranslation();
  const [deadlineDate, setDeadlineDate] = useState(null);

  const lang = (i18n.language || '').startsWith('en') ? 'en' : 'fi';
  const dateFormat = DATE_FORMATS[lang];

  useEffect(() => {
    if (!isOpen) return;
    const raw = editingMessage?.deadline;
    if (!raw) {
      setDeadlineDate(null);
      return;
    }
    const parts = raw.split('-').map(Number);
    const parsed = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(raw);
    setDeadlineDate(isNaN(parsed.getTime()) ? null : parsed);
  }, [isOpen, editingId, editingMessage?.deadline]);

  if (!isOpen) return null;

  return (
    <div
      className="modal"
      id="message-modal"
      style={{ display: 'flex' }}
      onClick={(e) => e.target.id === 'message-modal' && onClose()}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">
            {editingMessage ? t('messageModal.editTitle') : t('messageModal.addTitle')}
          </h2>
          <button type="button" className="modal-close" aria-label={t('messageModal.close')} onClick={onClose}>
            &times;
          </button>
        </div>
        <form key={editingId ?? 'new'} id="message-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="message-title">{t('messageModal.formTitle')}</label>
            <input
              id="message-title"
              name="messageTitle"
              type="text"
              maxLength={100}
              required
              placeholder={t('messageModal.titlePlaceholder')}
              defaultValue={editingMessage?.title}
            />
          </div>
          <div className="form-group">
            <label htmlFor="message-content">{t('messageModal.content')}</label>
            <textarea
              id="message-content"
              name="messageContent"
              rows={4}
              maxLength={500}
              required
              placeholder={t('messageModal.contentPlaceholder')}
              defaultValue={editingMessage?.content}
            />
          </div>
          <div className="form-group">
            <label htmlFor="message-category">{t('messageModal.category')}</label>
            <select
              id="message-category"
              name="messageCategory"
              defaultValue={editingMessage?.category || defaultCategory || 'uutisia'}
            >
              <option value="uutisia">{t(getCategoryI18nKey('uutisia'))}</option>
              <option value="tutkimus">{t(getCategoryI18nKey('tutkimus'))}</option>
              <option value="yritysyhteistyö">{t(getCategoryI18nKey('yritysyhteistyö'))}</option>
              <option value="opintohallinto">{t(getCategoryI18nKey('opintohallinto'))}</option>
              <option value="hr">{t(getCategoryI18nKey('hr'))}</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="message-deadline">{t('messageModal.deadline')}</label>
            <input
              type="hidden"
              name="messageDeadline"
              value={deadlineDate ? format(deadlineDate, 'yyyy-MM-dd') : ''}
            />
            <DatePicker
              id="message-deadline"
              selected={deadlineDate}
              onChange={(d) => setDeadlineDate(d)}
              dateFormat={dateFormat}
              locale={lang}
              placeholderText={PLACEHOLDERS[lang]}
              isClearable
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              className="datepicker-input"
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              {t('messageModal.cancel')}
            </button>
            <button type="submit" className="btn-submit">
              {t('messageModal.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
